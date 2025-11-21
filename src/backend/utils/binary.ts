/**
 * Converts a JSON representation of a byte array to a raw array of byte values
 * @param json JSON representation of a byte array
 * @returns {@linkcode Array<number>} containing the bytes
 */
export const convertByteArrayJsonToByteArray = (json: string) => {
    const obj = JSON.parse(json) as Record<string, number>;
    const arr: Array<number> = [];

    for (const b of Object.getOwnPropertyNames(obj)) {
        arr[b] = obj[b];
    }

    return arr;
};