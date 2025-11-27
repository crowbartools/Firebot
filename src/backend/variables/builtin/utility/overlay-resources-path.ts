import path from "path";
import type { ReplaceVariable } from "../../../../types/variables";
import * as dataAccess from "../../../common/data-access";

const model : ReplaceVariable = {
    definition: {
        handle: "overlayResourcesPath",
        usage: "overlayResourcesPath",
        description: "Evaluate the full path to the overlay-resources folder as a text string. Useful for for when images/sounds/videos are stored in the overlay-resources folder.",
        examples: [
            {
                usage: "overlayResourcesPath[sub, dir, path, image.gif]",
                description: "Gets the full path to the `/sub/dir/path/image.gif` in the overlay-resources folder as a text string."
            }
        ],
        categories: ["advanced"],
        possibleDataOutput: ["text"]
    },
    evaluator: (_, ...values: string[]) =>
        (
            (values != null || values.length > 0)
                ? `${path.resolve(dataAccess.getPathInUserData("/overlay-resources"), values.join("/"))}`
                : dataAccess.getPathInUserData("/overlay-resources")
        )
};

export default model;