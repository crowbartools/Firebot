import type { ReplaceVariable } from "../../../../types/variables";
import { getRandomImage } from "../../../common/handlers/reddit-processor";

const model : ReplaceVariable = {
    definition: {
        handle: "randomRedditImage",
        usage: "randomRedditImage[subredditName]",
        description: "Get a random image from a subreddit. (We do our best to check for bad images, but content warning none the less.)",
        possibleDataOutput: ["text"]
    },
    evaluator: async (_, subreddit: string) => {
        if (subreddit != null) {
            return await getRandomImage(subreddit);
        }

        return "";
    }
};

export default model;