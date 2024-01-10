/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { registerAs } from "@nestjs/config";
import path from "path";

export const AppConfig = registerAs("app", () => {
  const workingDirectoryPath = process.env.WORKING_DIRECTORY_PATH ?? process.cwd();
  const userDataPath = process.env.USER_DATA_PATH ?? workingDirectoryPath;
  return {
    workingDirectoryPath: workingDirectoryPath,
    userDataPath: process.env.USER_DATA_PATH ?? workingDirectoryPath,
    firebotDataPath: path.join(userDataPath, "v6"),
    tempDataPath: path.join(userDataPath, "temp"),
  };
});
