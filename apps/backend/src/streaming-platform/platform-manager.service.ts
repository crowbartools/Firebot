import { StreamingPlatform } from "firebot-types";
import { Injectable } from '@nestjs/common';

import Twitch from "./platforms/twitch/twitch";

@Injectable()
export class PlatformManagerService {
    private platforms: StreamingPlatform[] = [
        new Twitch()
    ];

    registerStreamingPlatform(platform: StreamingPlatform): void {
        if (this.platforms.some((p) => p.id === platform.id)) {
            throw new Error(`Platform ${platform.id} is already registered.`);
        }
        this.platforms.push(platform);
    }

    getPlatform(id: string): StreamingPlatform | void {
        return this.platforms.find((p) => p.id === id);
    }

    getPlatforms(): StreamingPlatform[] {
        return this.platforms;
    }
}
