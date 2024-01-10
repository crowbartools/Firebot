import { ConfigurableModuleBuilder } from "@nestjs/common";

export type DataAccessModuleOptions = {
  workingDirectoryPath: string;
  userDataPath: string;
  firebotDataPath: string;
  tempDataPath: string;
};

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, ASYNC_OPTIONS_TYPE, OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<DataAccessModuleOptions>()
    .setClassMethodName('forRoot')
    .setExtras(
      {
        isGlobal: true,
      },
      (definition, extras) => ({
        ...definition,
        global: extras.isGlobal,
      })
    )
    .build();