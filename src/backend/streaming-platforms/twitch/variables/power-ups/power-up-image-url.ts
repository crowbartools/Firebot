import type { ReplaceVariable } from "../../../../../types/variables";
import powerUpsManager from "../../../../power-ups/power-ups-manager";
import { TwitchApi } from "../../api";

const model: ReplaceVariable = {
    definition: {
        handle: "powerUpImageUrl",
        description: "The image URL of the power-up",
        examples: [
            {
                usage: "powerUpImageUrl[powerUpName]",
                description: "The image URL of the given Power-Up. Name must be exact!"
            }
        ],
        categories: ["common"],
        possibleDataOutput: ["text"]
    },
    evaluator: async (trigger, powerUpName: string) => {
        if (!powerUpName) {
            const data = trigger.metadata.eventData ? trigger.metadata.eventData : trigger.metadata;
            return (data as { powerUpImage?: string }).powerUpImage ?? "";
        }

        const powerUpId = powerUpsManager.getPowerUpIdByName(powerUpName);
        if (powerUpId == null) {
            return "[Can't find Power-Up by name]";
        }

        const powerUp = await TwitchApi.powerUps.getCustomPowerUpById(powerUpId);
        if (powerUp == null) {
            return "[No Power-Up found]";
        }

        return powerUp.image?.url4x ?? powerUp.defaultImage.url4x;
    }
};

export default model;
