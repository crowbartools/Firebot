import { Injectable } from "@nestjs/common";
import { StreamingPlatform } from "firebot-types";

@Injectable()
export class PlatformEventListenerService {
  constructor() {}

  addPlatformListeners(platform: StreamingPlatform): void {
    platform.chat.on("chatItem", (item) => {
      console.log("new chat item", item);
    });
  }
}
