import { getRandomInt } from "./get-random-int";

/**
 * This will turn an array into an array of "chunked" arrays given a max chunk size
 *
 * Example:
 * Original array: `[1,2,3,4,5,6,7 8,9]`
 *
 * `chunkArray(array, 4)`: `[[1,2,3,4], [5,6,7,8], [9]]`
 *
 * @param array Array to break into chunks
 * @param maxSize Maximum number of elements for each array chunk
 * @returns An array of arrays, broken up by `maxSize`
 */
export const chunkArray = <E>(array: E[], maxSize: number): E[][] => {
    const chunked: E[][] = [];
    for (let i = 0; i < array.length; i += maxSize) {
        chunked.push(array.slice(i, i + maxSize));
    }
    return chunked;
};

/**
 * Checks if the first array includes all the elements in the second array
 * @param arr1 The first array
 * @param arr2 The second array
 * @returns `true` if the first array includes every element of the second array, or `false` otherwise
 */
export const containsAll = <T>(arr1: T[], arr2: T[]): boolean => {
    return arr2.every(i => arr1.includes(i));
};

/**
 * Finds the index of a given item in an array, case-insensitive
 * @param array Array to search
 * @param item Item to search for
 * @returns Index of the given element, or `-1` if not found
 */
export const findIndexIgnoreCase = <T = unknown>(array: T[], item: unknown) => {
    if (Array.isArray(array)) {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        const elementString = item.toString().toLowerCase();
        const search = array.findIndex(e => e.toString().toLowerCase() === elementString);
        return search;
    }

    return -1;
};

/**
 * Flattens nested arrays
 *
 * @param {[]} array An array of arrays
 * @returns A flattened copy of the passed array
 */
export const flattenArray = <T = unknown>(array: T[][]): T[] => {
    return array.reduce((flat, next) => flat.concat(next), []);
};

/**
 * Returns a random item from the specified array
 * @param array Array of items
 */
export const getRandomItem = <T = unknown>(array: T[]): T => {
    if (array == null || !array.length) {
        return null;
    }
    const randomIndex = getRandomInt(0, array.length - 1);
    return array[randomIndex];
};

/**
 * Shuffles an array
 *
 * @param array The array to shuffle
 * @returns A shuffled copy of the specified array
 */
export const shuffleArray = <T = unknown>(array: T[]): T[] => {
    const arrayCopy = array.slice(0);
    for (let i = arrayCopy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
    }
    return arrayCopy;
};