import type { ReplaceVariable } from "../../../../../types/variables";
import adManager from "../../ad-manager";

const model : ReplaceVariable = {
    definition: {
        handle: "isAdBreakRunning",
        description: "Whether or not an ad break is currently running",
        categories: ["common"],
        possibleDataOutput: ["bool"]
    },
    evaluator: () => {
        return adManager.isAdBreakRunning;
    }
};

export default model;