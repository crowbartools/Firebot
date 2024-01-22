import { Get } from "@nestjs/common";
import { StreamingPlatform } from "firebot-types";
import { FirebotController } from "misc/firebot-controller.decorator";
import { PlatformManagerService } from "streaming-platform/platform-manager.service";

@FirebotController({
    path: "streaming-platform",
})
export class StreamingPlatformController {
    constructor(private readonly platformManager: PlatformManagerService){}

    @Get()
    async getPlatforms(): Promise<Array<Pick<StreamingPlatform, "id" | "name" | "color">>> {
        return this.platformManager.getPlatforms().map((p) => ({
            id: p.id,
            name: p.name,
            color: p.color,
        }));
    }
}