import Roll from "roll";
import { TwitchApi } from "../../streaming-platforms/twitch/api";
import { Trigger } from "../../../types/triggers";

export interface DiceEffectModel {
    dice: string;
    chatter: string;
    whisper: string;
    resultType: string;
}

const diceRoller = new Roll();

function processDice(diceConfig: string, showEach: boolean): string | number {
    diceConfig = diceConfig?.replace(/ /g, "");

    if (!diceRoller.validate(diceConfig)) {
        return null;
    }

    const { result, rolled } = diceRoller.roll(diceConfig);

    if (!showEach) {
        return result;
    }

    return `${result} (${rolled.join(", ")})`;
}

async function handleDiceEffect(effect: DiceEffectModel, trigger: Trigger) {
    const { dice, chatter, whisper, resultType } = effect;

    const showEach = resultType === "individual";
    const output = processDice(dice, showEach);
    const username = trigger.metadata.username;
    const message = output != null ?
        `Dice Roll: ${username} rolled a ${output} on ${dice}.` :
        `Unable to roll "${dice}" as it's not in the correct format.`;

    if (whisper) {
        const user = await TwitchApi.users.getUserByName(whisper);
        await TwitchApi.whispers.sendWhisper(user.id, message, chatter.toLowerCase() === "bot");
    } else {
        await TwitchApi.chat.sendChatMessage(message, null, chatter.toLowerCase() === "bot");
    }
}

export { handleDiceEffect, processDice };