import { Module } from "@nestjs/common";
import { PlatformManagerService } from "./platform-manager.service";

@Module({
  imports: [],
  controllers: [],
  providers: [PlatformManagerService],
})
export class StreamingPlatformModule {}
