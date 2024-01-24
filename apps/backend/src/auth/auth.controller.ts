import { AuthProviderManager } from "auth/auth-provider-manager.service";
import { FirebotController } from "misc/firebot-controller.decorator";

@FirebotController({
    path: "auth",
})
export class AuthController {
    constructor(private readonly authProviderManager: AuthProviderManager) {
    }
}