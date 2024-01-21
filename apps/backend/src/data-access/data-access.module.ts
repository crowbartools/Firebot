import { Global, Module } from "@nestjs/common";
import { ConfigurableModuleClass, DataAccessModuleOptions, MODULE_OPTIONS_TOKEN } from "data-access/data-access.module-definition";
import { ensureFirebotDirectoriesExist } from "data-access/ensure-directories";
import { ProfileController } from "data-access/profile.controller";
import { ProfileService } from "data-access/profile.service";
import { GlobalSettingsStore } from "data-access/stores/global-settings.store";
import { ProfileSettingsStore } from "data-access/stores/profile-settings.store";
import { StreamingPlatformAuthStore } from "data-access/stores/streaming-platform-auth.store";

const profileStores = [
  ProfileSettingsStore,
  StreamingPlatformAuthStore,
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
  controllers: [ProfileController],
  exports: [...profileStores],
  imports: [],
})
export class DataAccessModule extends ConfigurableModuleClass {}
