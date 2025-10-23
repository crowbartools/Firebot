import type { ReplaceVariable } from "../../../../types/variables";
import frontendCommunicator from "../../../common/frontend-communicator";

const model : ReplaceVariable = {
    definition: {
        handle: "audioDuration",
        usage: "audioDuration[filePathOrUrl]",
        description: "Attempts to retrieve audio duration.",
        examples: [
            {
                usage: `audioDuration["path/to/audio.mp3"]`,
                description: "Returns the duration of the audio file in seconds."
            },
            {
                usage: `audioDuration["https://example.com/audio.mp3"]`,
                description: "Returns the duration of the audio file from a URL in seconds."
            }
        ],
        categories: ["advanced"],
        possibleDataOutput: ["number", "text"]
    },
    evaluator: async (trigger, url) => {
        if (url == null) {
            return "[NO URL PROVIDED]";
        }
        try {
            return await frontendCommunicator.fireEventAsync("getSoundDuration", {
                path: url
            });
        } catch {
            return "[ERROR FETCHING DURATION]";
        }
    }
};

export default model;
