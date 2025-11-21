/**
 * Capitalizes a word/phrase, making the rest of the string lowercase
 * @param word Word or phrase to capitalize
 */
export const capitalize = (word: string): string => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
};