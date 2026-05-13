import type { ReplaceVariable } from "../../../../../types/variables";
import powerUpsManager from "../../../../power-ups/power-ups-manager";
import { TwitchApi } from "../../api";

const model: ReplaceVariable = {
    definition: {
        handle: "powerUpDescription",
        description: "The description of the power-up",
        examples: [
            {
                usage: "powerUpDescription[powerUpName]",
                description: "The description of the given power-up. Name must be exact!"
            }
        ],
        categories: ["common"],
        possibleDataOutput: ["text"]
    },
    evaluator: async (trigger, powerUpName: string) => {
        if (!powerUpName) {
            const data = trigger.metadata.eventData ? trigger.metadata.eventData : trigger.metadata;
            const description = (data as { powerUpDescription?: string }).powerUpDescription;
            if (description != null) {
                return description;
            }
            const powerUpId = (data as { powerUpId?: string }).powerUpId;
            if (!powerUpId) {
                return "";
            }
            const powerUp = await TwitchApi.powerUps.getCustomPowerUpById(powerUpId);
            return powerUp?.prompt ?? "";
        }

        const powerUpId = powerUpsManager.getPowerUpIdByName(powerUpName);
        if (powerUpId == null) {
            return "[Can't find power-up by name]";
        }

        const powerUp = await TwitchApi.powerUps.getCustomPowerUpById(powerUpId);
        if (powerUp == null) {
            return "[No power-up found]";
        }

        return powerUp.prompt;
    }
};

export default model;
