import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { StreamingPlatform } from "firebot-types";

@Injectable()
export class PlatformEventListenerService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  addPlatformListeners(platform: StreamingPlatform): void {
    platform.chat.on("chatItem", (item) => {
      this.eventEmitter.emit("platform.chatItem", {
        platform,
        data: item,
      });
    });
  }
}
