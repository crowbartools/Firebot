import { isPlainObject } from "./objects";

export type MaskPIIOptions = {
    /**
     * Replace matches with this token.
     * @default "***"
     */
    mask?: string;
    /** Additional key name hints to force masking (merged with built-ins). */
    extraKeyHints?: RegExp;
};

const DEFAULT_MASK = "***";

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}\b/g;

const IPV4_RE =
    /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g;
const IPV6_RE =
    /\b(?:[A-Fa-f0-9]{1,4}:){1,7}[A-Fa-f0-9]{1,4}\b/g;

// Credit card candidate: 13–19 digits with optional spaces/dashes; validated by Luhn before masking.
const CC_CANDIDATE_RE = /(?<!\d)(?:\d[ -]?){13,19}(?!\d)/g;

// Phone: flexible, then digit-count filter (10–15 digits).
const PHONE_CANDIDATE_RE = /(?<!\w)(?:\+?\d[\d().\s-]{8,}\d)(?!\w)/g;

// Street address (very heuristic): number + street name + street type
const ADDRESS_RE = new RegExp(
    String.raw`\b\d{1,6}\s+[A-Za-z0-9.'\- ]{1,40}\s+(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct|way|trail|trl|parkway|pkwy|circle|cir|place|pl|square|sq|terrace|ter|highway|hwy)\b\.?`,
    "i"
);

// Built-in key-name hints that force masking for a value (strings/numbers/objects).
const BUILT_IN_KEY_HINTS =
    /\b(email|e[-_ ]?mail|phone|mobile|tel|fax|contact|ip(v[46])?|address|addr|street|city|state|zip|postal|card|cc|pan|cvv|exp(iry|iration)?|ssn|tax[_-]?id|nid|passport)\b/i;

function luhnCheck(digitsOnlyString: string) {
    let sum = 0, even = false;
    digitsOnlyString.split("").reverse().forEach(function(dstr: string) {
        const d = parseInt(dstr);
        // eslint-disable-next-line no-cond-assign
        sum += ((even = !even) ? d : (d < 5) ? d * 2 : (d - 5) * 2 + 1);
    });
    return (sum % 10 === 0);
}

function maskCreditCards(s: string, mask: string): string {
    return s.replace(CC_CANDIDATE_RE, (m) => {
        const digits = m.replace(/[ -]/g, "");
        if (digits.length >= 13 && digits.length <= 19 && luhnCheck(digits)) {
            return mask;
        }
        return m;
    });
}

function maskPhones(s: string, mask: string): string {
    return s.replace(PHONE_CANDIDATE_RE, (m) => {
        const digits = (m.match(/\d/g) || []).length;
        if (digits >= 10 && digits <= 15) {
            return mask;
        }
        return m;
    });
}

function maskByRegexes(s: string, mask: string): string {
    let out = s;

    // Order matters: specific → general
    out = maskCreditCards(out, mask);
    out = out.replace(EMAIL_RE, mask);
    out = out.replace(IPV4_RE, mask);
    out = out.replace(IPV6_RE, mask);
    out = maskPhones(out, mask);

    // Address is heuristic and single-shot; loop in case of multiple addresses in one string
    for (let i = 0; i < 5 && ADDRESS_RE.test(out); i++) {
        out = out.replace(ADDRESS_RE, mask);
    }

    return out;
}

/**
 * Recursively mask PII in an unknown value. Returns a new structure with the same shape (but strings redacted).
 */
export function maskPII<T = unknown>(input: T, opts: MaskPIIOptions = {}): T {
    const mask = opts.mask ?? DEFAULT_MASK;
    const maxDepth = 100;
    const keyHints = opts.extraKeyHints
        ? new RegExp(`${opts.extraKeyHints.source}|${BUILT_IN_KEY_HINTS.source}`, "i")
        : BUILT_IN_KEY_HINTS;

    const seen = new WeakMap<object, unknown>();

    function redactString(s: string): string {
        if (s.length === 0) {
            return s;
        }
        return maskByRegexes(s, mask);
    }

    function shouldForceMaskByKey(key: string): boolean {
        return keyHints.test(key);
    }

    function redactValue(value: unknown, depth: number, parentKey?: string): unknown {
        if (depth > maxDepth) {
            return value;
        }

        // Strings: always scan
        if (typeof value === "string") {
            // If key hints at PII, be aggressive (full mask) when it still looks risky
            if (parentKey && shouldForceMaskByKey(parentKey)) {
                const masked = redactString(value);
                return masked === value ? mask : masked;
            }
            return redactString(value);
        }

        // Numbers: if key hints at PII (e.g., card, phone, zip), mask
        if (typeof value === "number") {
            if (parentKey && shouldForceMaskByKey(parentKey)) {
                return mask;
            }
            return value;
        }

        // Booleans, null, undefined, symbols, bigints: leave as-is
        if (
            value === null ||
      value === undefined ||
      typeof value === "boolean" ||
      typeof value === "symbol" ||
      typeof value === "bigint"
        ) {
            return value;
        }

        // Dates/Regex/Functions: leave as-is (not logged as PII by content)
        if (value instanceof Date || value instanceof RegExp || typeof value === "function") {
            return value;
        }

        // Arrays
        if (Array.isArray(value)) {
            if (seen.has(value)) {
                return seen.get(value);
            }
            const arr: unknown[] = [];
            seen.set(value, arr);
            for (let i = 0; i < value.length; i++) {
                arr[i] = redactValue(value[i], depth + 1, parentKey);
            }
            return arr as unknown;
        }

        // Plain objects
        if (isPlainObject(value)) {
            if (seen.has(value)) {
                return seen.get(value);
            }
            const out: Record<string, unknown> = {};
            seen.set(value, out);

            for (const [k, v] of Object.entries(value)) {
                // If key hints at PII and value is primitive/string/object, mask aggressively
                if (shouldForceMaskByKey(k)) {
                    if (typeof v === "string" || typeof v === "number" || v == null) {
                        out[k] = mask;
                        continue;
                    }
                    // If it's a nested structure under a PII key, either mask whole thing or recurse and mask strings.
                    // We'll recurse to avoid losing non-PII structure, but still mask any strings fully.
                    out[k] = redactValue(v, depth + 1, k);
                    continue;
                }
                out[k] = redactValue(v, depth + 1, k);
            }
            return out as unknown;
        }

        // Maps/Sets: convert to plain (optional). Here we keep shape by mapping values.
        if (value instanceof Map) {
            if (seen.has(value)) {
                return seen.get(value);
            }
            const arr: [unknown, unknown][] = [];
            seen.set(value, arr);
            value.forEach((v, k) => {
                arr.push([redactValue(k, depth + 1), redactValue(v, depth + 1)]);
            });
            return arr; // or convert back to Map if your logging supports it
        }

        if (value instanceof Set) {
            if (seen.has(value)) {
                return seen.get(value);
            }
            const arr: unknown[] = [];
            seen.set(value, arr);
            value.forEach(v => arr.push(redactValue(v, depth + 1)));
            return arr;
        }

        // Fallback: return as-is
        return value;
    }

    return redactValue(input, 0) as T;
}