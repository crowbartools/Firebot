import { DateTime } from "luxon";
import type { ReplaceVariable } from "../../../../../types/variables";
import { TwitchApi } from "../../api";
import adManager from "../../ad-manager";

const model : ReplaceVariable = {
    definition: {
        handle: "secondsUntilNextAdBreak",
        description: "The number of seconds until the next schduled ad break",
        categories: ["common"],
        possibleDataOutput: ["number"]
    },
    evaluator: async (trigger) => {
        let secondsUntilNextAdBreak = trigger.metadata?.eventData?.secondsUntilNextAdBreak
            ?? adManager.secondsUntilNextAdBreak
            ?? 0;

        if (secondsUntilNextAdBreak === 0) {
            const adSchedule = await TwitchApi.channels.getAdSchedule();

            if (adSchedule?.nextAdDate != null) {
                secondsUntilNextAdBreak = Math.abs(DateTime.fromJSDate(adSchedule.nextAdDate).diffNow("seconds").seconds);
            }
        }

        return secondsUntilNextAdBreak;
    }
};

export default model;