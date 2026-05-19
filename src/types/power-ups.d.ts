import type { CustomPowerUp } from "../backend/streaming-platforms/twitch/api/resource/power-ups";
import type { EffectList } from "./effects";

export type SavedPowerUp = {
    id: string;
    twitchData: CustomPowerUp;
    effects?: EffectList;
    sortTags?: string[];
};

export type PowerUpRedemptionMetadata = {
    username: string;
    userId: string;
    userDisplayName: string;
    messageText: string;
    powerUpId: string;
    powerUpImage: string;
    powerUpName: string;
    bits: number;
};
