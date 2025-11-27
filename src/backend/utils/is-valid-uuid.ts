/**
 * Checks if a string is a valid UUID
 * @param uuid String to validate
 * @returns `true` if the provided string is a valid UUID, or `false` otherwise
 */
export function isValidUUID(uuid: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        .test(uuid);
}