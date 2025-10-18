/**
 * Escapes RegExp special charaters in a string
 * @param str String to escape
 */
export const escapeRegExp = (str: string): string => {
    // eslint-disable-next-line no-useless-escape
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};