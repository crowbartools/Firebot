import fs from "fs/promises";
import path from "path";

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

export async function ensureFirebotDataDirExists(firebotDataPath: string, relativePath = "") {
  const fullPath = path.join(firebotDataPath, relativePath);
  if (!(await pathExists(fullPath))) {
    await fs.mkdir(fullPath, { recursive: true });
  }
}
