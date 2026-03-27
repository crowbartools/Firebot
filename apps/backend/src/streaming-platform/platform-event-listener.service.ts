import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { StreamingPlatform } from "firebot-types";

@Injectable()
export class PlatformEventListenerService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  addPlatformListeners(platform: StreamingPlatform): void {
    platform.on("connected", () => {
      this.eventEmitter.emit("platform.connected", {
        platform,
      });
    });

    platform.on("disconnected", () => {
      this.eventEmitter.emit("platform.disconnected", {
        platform,
      });
    });

    platform.chat.on("chatItem", (item) => {
      this.eventEmitter.emit("platform.chatItem", {
        platform,
        data: item,
      });
    });
  }
}
