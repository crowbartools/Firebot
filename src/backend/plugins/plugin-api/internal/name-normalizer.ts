/**
 * Normalizes a plugin name or file name into a slug safe for use
 * as a stable identifier.
 */
export function normalizeName(value: string | undefined | null): string {
    if (value == null) {
        return "";
    }
    return value
        .replace(/[#%&{}\\<>*?/$!'":@`|=\s-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
}
