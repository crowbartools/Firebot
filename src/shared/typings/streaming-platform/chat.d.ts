import { OnlyRequire } from "../modules/global";
import { Id } from "./helpers";
import { PlatformUser } from "./user";

export interface Badge {
    id: string;
    name: string;
    url: string;
    platformId: string;
}

export interface MessagePartType {
    type: "text" | "emote";
}

export interface TextMessagePart extends MessagePartType {
    type: "text";
    text: string;
}

export interface EmoteMessagePart extends MessagePartType {
    type: "emote";
    id: Id;
    name: string;
    url: string;
}

export interface ChatMessage {
    id: Id;
    platformId: string;
    user: OnlyRequire<PlatformUser, "id" | "username" | "displayName" | "roles">;
    avatarUrl: string;
    deleted?: boolean;
    tagged?: boolean;
    whisper: boolean;
    badges: Badge[];
    rawText: string;
    parts: Array<TextMessagePart | EmoteMessagePart>;
    metadata: Record<string, unknown>;
}
