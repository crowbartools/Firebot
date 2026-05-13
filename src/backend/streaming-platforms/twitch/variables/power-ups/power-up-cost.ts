import type { ReplaceVariable } from "../../../../../types/variables";
import powerUpsManager from "../../../../power-ups/power-ups-manager";
import { TwitchApi } from "../../api";

const model: ReplaceVariable = {
    definition: {
        handle: "powerUpCost",
        description: "The bit cost of the power-up",
        examples: [
            {
                usage: "powerUpCost[powerUpName]",
                description: "The bit cost of the given power-up. Name must be exact!"
            }
        ],
        categories: ["common"],
        possibleDataOutput: ["number"]
    },
    evaluator: async (trigger, powerUpName: string) => {
        if (!powerUpName) {
            const data = trigger.metadata.eventData ? trigger.metadata.eventData : trigger.metadata;
            const bits =
                (data as { powerUpCost?: number, bits?: number }).powerUpCost ??
                (data as { powerUpCost?: number, bits?: number }).bits;
            return bits ?? -1;
        }

        const powerUpId = powerUpsManager.getPowerUpIdByName(powerUpName);
        if (powerUpId == null) {
            return -1;
        }

        const powerUp = await TwitchApi.powerUps.getCustomPowerUpById(powerUpId);
        if (powerUp == null) {
            return -1;
        }

        return powerUp.bits;
    }
};

export default model;
