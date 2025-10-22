import { ReplaceVariable } from "../../../../../types/variables";
import tinycolor from "tinycolor2";

export const ColorValueVariable: ReplaceVariable = {
    definition: {
        handle: "obsColorValue",
        description: "Returns an OBS color value based on either a hex color code (e.g. #0066FF) or an HTML color name.",
        categories: ["advanced", "integrations", "obs"],
        possibleDataOutput: ["number"]
    },
    evaluator: (_, ...args: string[]) => {
        let rawValue = tinycolor(args[0]).toHex8();

        rawValue = rawValue.replace("#", "");
        const obsHexValue = `${rawValue.substring(6, 8)}${rawValue.substring(4, 6)}${rawValue.substring(2, 4)}${rawValue.substring(0, 2)}`;

        return parseInt(obsHexValue, 16);
    }
};