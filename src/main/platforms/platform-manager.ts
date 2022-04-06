import { StreamingPlatform } from "SharedTypes/streaming-platform";

const platforms: StreamingPlatform[] = [];

export function registerStreamingPlatform(platform: StreamingPlatform): void {
    if (platforms.some((p) => p.id === platform.id)) {
        throw new Error(`Platform ${platform.id} is already registered.`);
    }
    platforms.push(platform);
}

export function getPlatform(id: string): StreamingPlatform | void {
    return platforms.find((p) => p.id === id);
}
