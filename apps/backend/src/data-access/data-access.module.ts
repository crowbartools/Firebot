import { Global, Module } from "@nestjs/common";
import { ConfigurableModuleClass, DataAccessModuleOptions, MODULE_OPTIONS_TOKEN } from "data-access/data-access.module-definition";
import { ensureFirebotDirectoriesExist } from "data-access/ensure-directories";
import { GlobalSettingsStore } from "data-access/global-settings-store";

@Global()
@Module({
  providers: [
    GlobalSettingsStore,
    {
      provide: "ASYNC_ENSURE_DIRECTORIES",
      useFactory: async (
        options: DataAccessModuleOptions,
        globalSettingsStore: GlobalSettingsStore
      ) => {
        await ensureFirebotDirectoriesExist(options, globalSettingsStore);
      },
      inject: [MODULE_OPTIONS_TOKEN, GlobalSettingsStore],
    },
  ],
  exports: [],
})
export class DataAccessModule extends ConfigurableModuleClass {}
