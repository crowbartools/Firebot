import type { ReplaceVariable } from "../../../../types/variables";
import frontendCommunicator from "../../../common/frontend-communicator";
import logger from "../../../logwrapper";

const model : ReplaceVariable = {
    definition: {
        handle: "videoDuration",
        usage: "videoDuration[filePathOrUrl]",
        description: "Attempts to retrieve video duration.",
        examples: [
            {
                usage: `videoDuration["path/to/video.mp4"]`,
                description: "Returns the duration of the video file in seconds."
            },
            {
                usage: `videoDuration["https://example.com/video.mp4"]`,
                description: "Returns the duration of the video file from a URL in seconds."
            }
        ],
        categories: ["advanced"],
        possibleDataOutput: ["text", "number"]
    },
    evaluator: async (trigger, url: string) => {
        if (url == null) {
            return "[NO URL PROVIDED]";
        }
        const result: number = await frontendCommunicator.fireEventAsync("getVideoDuration", url);

        if (isNaN(result)) {
            logger.error("Error while retrieving video duration", result);
            return "[ERROR FETCHING DURATION]";
        }
        return result;
    }
};

export default model;