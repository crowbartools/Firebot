/**
 * Formats a number as a string with commas between digit groups (e.g. `"1,000,000"`)
 * @param number Number to commafy
 * @returns String with comma-formatted number
 */
export const commafy = (number: number): string => {
    return number == null ? null : number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};