import { Module } from "@nestjs/common";
import { PlatformManagerService } from "./platform-manager.service";
import { StreamingPlatformController } from "streaming-platform/streaming-platform.controller";
import { PlatformEventListenerService } from "./platform-event-listener.service";

@Module({
  imports: [],
  controllers: [StreamingPlatformController],
  providers: [PlatformManagerService, PlatformEventListenerService],
  exports: [PlatformManagerService],
})
export class StreamingPlatformModule {}
