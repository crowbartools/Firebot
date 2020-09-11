type Id = string | number;

interface UserRole {
    id: string;
    name: string;
}

interface Badge {
    id: string;
    name: string;
    url: string;
}

interface MessagePartType {
    type: "text" | "emote";
}

interface TextMessagePart extends MessagePartType {
    type: "text";
    text: string;
}

interface EmoteMessagePart extends MessagePartType {
    type: "emote";
    id: Id;
    name: string;
    url: string;
}

interface PlatformUser {
    id: Id;
    username: string;
    displayName: string;
    roles?: UserRole[];
}

interface ChatMessage {
    id: Id;
    platformId: string;
    user: PlatformUser;
    avatarUrl: string;
    deleted?: boolean;
    tagged?: boolean;
    whisper: boolean;
    badges: Badge[];
    rawText: string;
    parts: Array<TextMessagePart | EmoteMessagePart>;
    metadata: Record<string, unknown>;
}

interface PlatformApi {
    getUser: (id: Id) => Promise<PlatformUser>;
    getUserByName: (username: string) => Promise<PlatformUser>;
}

interface StreamingPlatform extends NodeJS.EventEmitter {
    id: string;
    name: string;
    init: VoidFunction;
    connect: VoidFunction;
    disconnect: VoidFunction;
    api: PlatformApi;
}
