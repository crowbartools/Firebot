// Migration: done

"use strict";

const randomRedditImage = require("../../common/handlers/redditProcessor");
const { OutputDataType } = require("../../../shared/variable-constants");

const model = {
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

module.exports = model;
