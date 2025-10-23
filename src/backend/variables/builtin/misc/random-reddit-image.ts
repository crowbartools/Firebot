import type { ReplaceVariable } from "../../../../types/variables";

import randomRedditImage from "../../../common/handlers/redditProcessor";

const model : ReplaceVariable = {
    definition: {
        handle: "randomRedditImage",
        usage: "randomRedditImage[subredditName]",
        description: "Get a random image from a subreddit. (We do our best to check for bad images, but content warning none the less.)",
        possibleDataOutput: ["text"]
    },
    evaluator: async (_, subreddit) => {
        if (subreddit != null) {
            return await randomRedditImage.getRandomImage(subreddit);
        }

        return "";
    }
};

export default model;