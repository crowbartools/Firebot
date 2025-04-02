import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const frontendCommunicator = require("../../../common/frontend-communicator");

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
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.NUMBER, OutputDataType.TEXT]
    },
    evaluator: async (trigger, url) => {
        if (url == null) {
            return "[NO URL PROVIDED]";
        }
        try {
            return await frontendCommunicator.fireEventAsync("getSoundDuration", {
                path: url
            });
        } catch (err) {
            return "[ERROR FETCHING DURATION]";
        }
    }
};

export default model;
