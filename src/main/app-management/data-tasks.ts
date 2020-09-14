import { ensureFirebotDataDirExists } from "../utils";

export async function makeFirebotDataDir() {
    await ensureFirebotDataDirExists();
}

export async function ensureRootDataDirsExist() {
    const rootDirs = ["logs", "backups", "clips", "profiles"];
    for (const dir of rootDirs) {
        await ensureFirebotDataDirExists(dir);
    }
}
