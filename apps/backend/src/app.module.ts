// import { resolve } from "node:path";
import { Module } from "@nestjs/common";
// import { ServeStaticModule } from '@nestjs/serve-static';
import { ExampleController } from "./example.controller";
import { StreamingPlatformModule } from "./streaming-platform/streaming-platform.module";
import { RealTimeModule } from "./real-time/real-time.module";
import { AuthModule } from "./auth/auth.module";
import { ConfigModule, ConfigType } from "@nestjs/config";
import { AppConfig } from "config/app.config";
import { DataAccessModule } from "data-access/data-access.module";

@Module({
  imports: [
    // ServeStaticModule.forRoot({
    //     rootPath: resolve(__dirname, '../../frontend/dist'),
    //     exclude: ['/api/*']
    // }),
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      validationOptions: {
        debug: true,
      },
      load: [AppConfig],
    }),
    DataAccessModule.forRootAsync({
      useFactory: (appConfig: ConfigType<typeof AppConfig>) => ({
        workingDirectoryPath: appConfig.workingDirectoryPath,
        userDataPath: appConfig.userDataPath,
        firebotDataPath: appConfig.firebotDataPath,
        tempDataPath: appConfig.tempDataPath,
      }),
      inject: [AppConfig.KEY],
    }),
    AuthModule,
    RealTimeModule,
    StreamingPlatformModule,
  ],
  controllers: [ExampleController],
  providers: [],
})
export class AppModule {}
