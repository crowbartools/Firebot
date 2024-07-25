import { ListenerSignature, TypedEmitter } from "tiny-typed-emitter";
import { Id } from "./helpers";
import { PlatformUser } from "./user";
import { OnlyRequire } from "../misc/util";

export interface Badge {
  id: string;
  name: string;
  url: string;
  platformId: string;
}

export interface MessagePartType {
  type: "text" | "emote" | "link";
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
  animatedUrl?: string;
  color?: string;
  isThirdParty?: boolean;
  thirdPartySource?: string;
}

export interface LinkMessagePart extends MessagePartType {
  type: "link";
  text: string;
  url: string;
}

export type MessagePart = TextMessagePart | EmoteMessagePart | LinkMessagePart;

export interface ChatMessage {
  id: Id;
  user: OnlyRequire<PlatformUser, "id" | "username" | "displayName" | "roles">;
  avatarUrl: string;
  deleted?: boolean;
  tagged?: boolean;
  whisper: boolean;
  badges: Badge[];
  rawText: string;
  parts: MessagePart[];
  metadata: Record<string, unknown>;
}

export interface ChatMessageItem {
  type: "message";
  chatMessage: ChatMessage;
}

export interface ChatModerationItem {
  type: "moderation";
  action: "delete-message" | "timeout-user" | "ban-user";
}

export interface ChatNotificationItem {
  type: "notification";
  text: string;
  icon: string;
}

export type ChatItem = { platformId: string } & (
  | ChatMessageItem
  | ChatModerationItem
  | ChatNotificationItem
);

interface ChatEvents {
  chatItem: (chatItem: ChatItem) => void;
}

export class ChatProvider<
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtraEvents extends ListenerSignature<ExtraEvents> = {},
> extends TypedEmitter<ChatEvents & ExtraEvents> {}
