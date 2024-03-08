/**
 * This will turn an array into an array of "chunked" arrays given a max chunk size
 * Example:
 *
 * Original array = [1,2,3,4,5,6,7 8,9]
 * chunkArray(array, 4) = [[1,2,3,4], [5,6,7,8], [9]];
 */

export const chunkArray = <E>(array: E[], maxSize: number): E[][] => {
    const chunked: E[][] = [];
    for (let i = 0; i < array.length; i += maxSize) {
        chunked.push(array.slice(i, i + maxSize));
    }
    return chunked;
};
