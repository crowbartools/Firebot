import { DataAccessModuleOptions } from "data-access/data-access.module-definition";
import { ensureFirebotDataDirExists } from "data-access/file-system-helpers";
import { GlobalSettingsStore } from "data-access/global-settings-store";
import path from "path";

 export async function ensureFirebotDirectoriesExist(
   options: DataAccessModuleOptions,
   globalSettingsStore: GlobalSettingsStore
 ) {
   await ensureFirebotDataDirExists(options.firebotDataPath);

   const rootDirs = ["logs", "backups", "clips", "profiles"];
   for (const dir of rootDirs) {
     await ensureFirebotDataDirExists(options.firebotDataPath, dir);
   }

   const profileId = globalSettingsStore.get("activeProfileId");
   await ensureFirebotDataDirExists(options.firebotDataPath, path.join("profiles", profileId));
 }