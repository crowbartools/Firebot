import type { CustomPowerUp } from "../backend/streaming-platforms/twitch/api/resource/power-ups";
import type { EffectList } from "./effects";
import type { RestrictionData } from "./restrictions";

export type SavedPowerUp = {
    id: string;
    twitchData: CustomPowerUp;
    effects?: EffectList;
    restrictionData?: RestrictionData;
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
