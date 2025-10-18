/**
 * Converts an object to its string representation
 * @param subject Object to stringify
 */
export const stringify = (subject: unknown): string => {
    if (subject == null) {
        return '';
    }
    if (typeof subject === 'string' || subject instanceof String) {
        return `${subject.toString()}`;
    }

    return JSON.stringify(subject);
};