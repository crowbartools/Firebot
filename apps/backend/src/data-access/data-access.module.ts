import { Global, Module } from "@nestjs/common";
import { ConfigurableModuleClass, DataAccessModuleOptions, MODULE_OPTIONS_TOKEN } from "data-access/data-access.module-definition";
import { ensureFirebotDirectoriesExist } from "data-access/ensure-directories";
import { ProfileService } from "data-access/profile.service";
import { GlobalSettingsStore } from "data-access/stores/global-settings.store";
import { ProfileSettingsStore } from "data-access/stores/profile-settings.store";

const profileStores = [
  ProfileSettingsStore
];

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
    ProfileService,
    ...profileStores,
  ],
  exports: [],
  imports: [],
})
export class DataAccessModule extends ConfigurableModuleClass {}
