import fsp from "fs/promises";

/**
 * Deletes all items inside of a given folder without deleting the folder itself
 * @param path Path to folder
 */
export const emptyFolder = async (path: string) => {
    const entries = await fsp.readdir(path);

    for (const entry of entries) {
        await fsp.rm(entry, { recursive: true, force: true });
    }
};