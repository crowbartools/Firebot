import { Global, Module } from "@nestjs/common";
import { ConfigurableModuleClass, DataAccessModuleOptions, MODULE_OPTIONS_TOKEN, isFlatFileOptions } from "data-access/data-access.module-definition";
import { ensureFirebotDirectoriesExist } from "data-access/ensure-directories";

@Global()
@Module({
  providers: [
    {
      provide: "ASYNC_ENSURE_DIRECTORIES",
      useFactory: async (options: DataAccessModuleOptions) => {
        if(isFlatFileOptions(options)) {
            await ensureFirebotDirectoriesExist(options);
        }
      },
      inject: [MODULE_OPTIONS_TOKEN],
    },
  ],
  exports: [],
})
export class DataAccessModule extends ConfigurableModuleClass {}
