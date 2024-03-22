import { DateTime } from "luxon";
import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import twitchApi from "../../../../twitch-api/api";

const model : ReplaceVariable = {
    definition: {
        handle: "minutesUntilNextAdBreak",
        description: "The number of minutes until the next schduled ad break",
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async (trigger) => {
        let minutesUntilNextAdBreak = trigger.metadata?.eventData?.minutesUntilNextAdBreak ?? 0;

        if (minutesUntilNextAdBreak === 0) {
            const adSchedule = await twitchApi.channels.getAdSchedule();

            if (adSchedule?.nextAdDate != null) {
                minutesUntilNextAdBreak = Math.abs(DateTime.fromJSDate(adSchedule.nextAdDate).diffNow("minutes").minutes);
            }
        }

        return Math.round(minutesUntilNextAdBreak);
    }
};

export default model;