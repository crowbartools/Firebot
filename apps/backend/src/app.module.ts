import { Module } from "@nestjs/common";
// import { EventEmitterModule } from "@nestjs/event-emitter";
import { ConfigModule, ConfigType } from "@nestjs/config";
// import { ServeStaticModule } from '@nestjs/serve-static';
import { ExampleController } from "./example.controller";
import { StreamingPlatformModule } from "./streaming-platform/streaming-platform.module";
import { RealTimeModule } from "./real-time/real-time.module";
import { AuthModule } from "./auth/auth.module";
import { DataAccessModule } from "./data-access/data-access.module";
import { AppConfig } from "./config/app.config";
import { StreamingPlatformConfig } from "./config/streaming-platform.config";
import configSchema from "./config/config.schema";

@Module({
  imports: [
    // EventEmitterModule.forRoot({
    //   global: true,
    // }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../backend/.env"],
      validationSchema: configSchema,
      load: [AppConfig, StreamingPlatformConfig],
    }),
    // ServeStaticModule.forRoot({
    //     rootPath: resolve(__dirname, '../../frontend/dist'),
    //     exclude: ['/api/*']
    // }),
    DataAccessModule.forRootAsync({
      isGlobal: true,
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
