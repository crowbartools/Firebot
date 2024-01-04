import { FlatFileDataAccessOptions } from "data-access/data-access.module-definition";
import { ensureFirebotDataDirExists } from "data-access/file-system-helpers";

 export async function ensureFirebotDirectoriesExist(
    options: FlatFileDataAccessOptions
  ) {
    await ensureFirebotDataDirExists(options.firebotDataPath);

    const rootDirs = ["logs", "backups", "clips", "profiles"];
    for (const dir of rootDirs) {
      await ensureFirebotDataDirExists(options.firebotDataPath, dir);
    }
  }