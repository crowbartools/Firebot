export function getStringParam(
    parameters: Record<string, unknown>,
    key: string,
    fallback = ""
): string {
    const value = parameters[key];
    if (typeof value === "string") {
        return value;
    }

    if (value == null) {
        return fallback;
    }

    return String(value);
}

export function getBooleanParam(
    parameters: Record<string, unknown>,
    key: string,
    fallback = false
): boolean {
    const value = parameters[key];
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "true") {
            return true;
        }
        if (normalized === "false") {
            return false;
        }
    }

    if (typeof value === "number") {
        return value !== 0;
    }

    return fallback;
}

export function getNumberParam(
    parameters: Record<string, unknown>,
    key: string,
    fallback = 0
): number {
    const value = parameters[key];
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
        return parsed;
    }

    return fallback;
}
