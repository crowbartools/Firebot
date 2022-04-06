/**
 * Converts a wildcard pattern into a regexp instance
 *
 *  ? : Matches any 1 character
 *  *: Matches 0 or more characters
 *
 *  a? : Matches "aa" "ab" but not "a" or "abc"
 *  a* : Matches "a" "aa" "ab" "abc"
 *  a?*: Matches "aa" "ab" "abc" but not "a"
 */
export const wildcard = (wildcard: string, caseSensitive = false): RegExp => {
    return new RegExp(
        "^" +
            wildcard.replace(/[^a-z\d:?*]|[?*]+/i, (match) => {
                const hasStar = match.indexOf("*") > -1 ? "*" : "";

                if (match.indexOf("?") > -1) {
                    const count = match.match(/\?/g)?.length;

                    if (count != null && count > 4) {
                        return ".".repeat(count) + hasStar;
                    }

                    if (!hasStar) {
                        return `.{${count}}`;
                    }

                    return `.{${count},}`;
                } else if (hasStar) {
                    return ".*";
                } else {
                    return "\\" + match;
                }
            }) +
            "$",
        caseSensitive ? "gi" : "i"
    );
};
