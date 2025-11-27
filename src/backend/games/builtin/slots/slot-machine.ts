import { TwitchApi } from "../../../streaming-platforms/twitch/api";
import { getRandomInt, wait } from "../../../utils";

const SPIN_COUNT = 3;

async function spin(
    showSpinInActionMsg: boolean,
    spinInActionMsg: string,
    successChance: number,
    chatter: string
): Promise<number> {
    let successCount = 0;

    if (showSpinInActionMsg) {
        await TwitchApi.chat.sendChatMessage(
            spinInActionMsg,
            null,
            !chatter || chatter.toLowerCase() === "bot"
        );
    }

    for (let currentSpin = 1; currentSpin <= SPIN_COUNT; currentSpin++) {
        await wait(750);
        const successfulRoll = getRandomInt(1, 100) <= successChance;

        if (successfulRoll) {
            successCount++;
        }
    }

    return successCount;
}

export default { spin };