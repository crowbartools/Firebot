import twitchChat from "../../../chat/twitch-chat";
import util from "../../../utility";

const SPIN_COUNT = 3;

async function spin(
    showSpinInActionMsg: boolean,
    spinInActionMsg: string | null | undefined,
    successChance: number,
    chatter: "Streamer" | "Bot" | null | undefined
): Promise<number> {
    let successCount = 0;

    if (showSpinInActionMsg) {
        await twitchChat.sendChatMessage(spinInActionMsg, null, chatter);
    }

    for (let currentSpin = 1; currentSpin <= SPIN_COUNT; currentSpin++) {
        await util.wait(750);

        const successfulRoll = util.getRandomInt(1, 100) <= successChance;

        if (successfulRoll) {
            successCount++;
        }
    }

    return successCount;
}

export default {
    spin
};
