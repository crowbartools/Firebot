const colorConvert = require('color-convert');

import { ReplaceVariable } from "../../../../../types/variables";
import { VariableCategory } from "../../../../../shared/variable-constants";

export const ColorValueVariable: ReplaceVariable = {
    definition: {
        handle: "obsColorValue",
        description: "Returns an OBS color value based on either a hex color code (e.g. #0066FF) or an HTML color name.",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: ["number"]
    },
    evaluator: (_, ...args: string[]) => {
        let rawValue = args[0];
        let isHexColor = false;

        if (rawValue.startsWith("#")) {
            rawValue = rawValue.slice(1);
        }

        const regex = /^[0-9a-fA-F]{6}$/;
        if (regex.test(rawValue) === true) {
            isHexColor = true;
        }

        const color = isHexColor === true ? colorConvert.hex.rgb(rawValue) : colorConvert.keyword.rgb(rawValue);

        const obsHexValue = `FF${color[2].toString(16).padStart(2, "0")}${color[1].toString(16).padStart(2, "0")}${color[0].toString(16).padStart(2, "0")}`;

        return parseInt(obsHexValue, 16);
    }
};