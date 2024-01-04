/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { registerAs } from "@nestjs/config";

export const AppConfig = registerAs("app", () => ({
  workingDirectoryPath: process.env.WORKING_DIRECTORY_PATH!,
  userDataPath: process.env.USER_DATA_PATH!,
  firebotDataPath: process.env.FIREBOT_DATA_PATH!,
  tempDataPath: process.env.TEMP_DATA_PATH!,
}));
