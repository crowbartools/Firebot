import logger from "../logwrapper";
import accountAccess from "../common/account-access";
import integrationManager from "../integrations/integration-manager";
import twitchChat from "../chat/twitch-chat";
import { EffectType } from "../../types/effects";

type ValidationMode = "execution" | "display";

const serviceValidators = {
    twitch: (validateFor: ValidationMode) => {
        if (validateFor === "execution") {
            return twitchChat.chatIsConnected;
        }
        return !!accountAccess.getAccounts().streamer.loggedIn;
    },
    integration: async (integrationId: string, validateFor: ValidationMode) => {
        if (validateFor === "execution" && integrationManager.integrationCanConnect(integrationId)) {
            return integrationManager.integrationIsConnected(integrationId);
        }
        return integrationManager.integrationIsLinked(integrationId);
    }
};

export const checkEffectDependencies = (
    dependencies: EffectType<unknown>["definition"]["dependencies"],
    validateFor: ValidationMode
): boolean => {
    // backwards compatibility for legacy dependencies
    if (Array.isArray(dependencies)) {
        // legacy dependencies were not used for display validation so we want to match that behavior
        if (validateFor === "display") {
            return true;
        }
        return dependencies.every((dependency) => {
            switch (dependency) {
                case "chat":
                    return serviceValidators.twitch(validateFor);
                default:
                    // backwards compatibility for overlay dependency
                    if (dependency === "overlay") {
                        return true;
                    }
                    logger.debug(`Unknown effect dependency: ${dependency}`);
                    return false;
            }
        });
    }

    if (dependencies.twitch) {
        if (!serviceValidators.twitch(validateFor)) {
            return false;
        }
    }

    if (dependencies.integrations) {
        const integrationDependencies = dependencies.integrations;
        return Object.entries(integrationDependencies).every(([integrationId, isDependency]) => {
            return !isDependency || serviceValidators.integration(integrationId, validateFor);
        });
    }

    return true;
};
