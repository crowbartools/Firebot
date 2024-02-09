import { Module } from "@nestjs/common";
import { PlatformManagerService } from "./platform-manager.service";
import { StreamingPlatformController } from "streaming-platform/streaming-platform.controller";

@Module({
  imports: [],
  controllers: [StreamingPlatformController],
  providers: [PlatformManagerService],
  exports: [PlatformManagerService],
})
export class StreamingPlatformModule {}
