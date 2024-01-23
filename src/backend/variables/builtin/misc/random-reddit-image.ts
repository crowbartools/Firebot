import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType } from "../../../../shared/variable-constants";

const randomRedditImage = require("../../../common/handlers/redditProcessor");

const model : ReplaceVariable = {
    definition: {
        handle: "randomRedditImage",
        usage: "randomRedditImage[subredditName]",
        description: "Get a random image from a subreddit. (We do our best to check for bad images, but content warning none the less.)",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, subreddit) => {
        if (subreddit != null) {
            return randomRedditImage.getRandomImage(subreddit);
        }

        return "";
    }
};

export default model;