/**
 * Gets a URL-matching regular expression object
 * @param global Whether to enable the global flag. Default is `true`.
 * @returns A {@linkcode RegExp} that matches URL patterns
 */
export const getUrlRegex = (global = true): RegExp => new RegExp(
    /\b(?:https?:(?:\/\/)?)?(?:[a-z\d](?:[a-z\d-]{0,253}[a-z\d])?\.)+[a-z][a-z\d-]{0,60}[a-z\d](?:$|[\\/]|\w?)+/,
    `${global === true ? "g" : ""}i`
);