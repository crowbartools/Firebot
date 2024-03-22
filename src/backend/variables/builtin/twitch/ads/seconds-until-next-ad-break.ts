import { DateTime } from "luxon";
import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import twitchApi from "../../../../twitch-api/api";
import adManager from "../../../../twitch-api/ad-manager";

const model : ReplaceVariable = {
    definition: {
        handle: "secondsUntilNextAdBreak",
        description: "The number of seconds until the next schduled ad break",
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async (trigger) => {
        let secondsUntilNextAdBreak = trigger.metadata?.eventData?.secondsUntilNextAdBreak
            ?? adManager.secondsUntilNextAdBreak
            ?? 0;

        if (secondsUntilNextAdBreak === 0) {
            const adSchedule = await twitchApi.channels.getAdSchedule();

            if (adSchedule?.nextAdDate != null) {
                secondsUntilNextAdBreak = Math.abs(DateTime.fromJSDate(adSchedule.nextAdDate).diffNow("seconds").seconds);
            }
        }

        return secondsUntilNextAdBreak;
    }
};

export default model;