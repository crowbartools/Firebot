import { FirebotChatMessage } from "../../../types/chat";
import logger from "../../logwrapper";
import twitchApi from "../../twitch-api/api";

class RaidMessageChecker {
    private readonly _chatCacheLimit = 50;
    private _messageCache: FirebotChatMessage[] = [];
    private _raidMessage = "";
    private _checkerEnabled = false;
    private _settings = {
        shouldBan: false,
        shouldBlock: false
    };

    private async handleRaider(message: FirebotChatMessage): Promise<void> {
        if (this._settings.shouldBan) {
            await twitchApi.moderation.banUser(message.userId);
        }

        if (this._settings.shouldBlock) {
            await twitchApi.users.blockUser(message.userId);
        }
    }

    private getRaidMessage(): string {
        const rawMessages = this._messageCache.map(message => message.rawText);
        const raidMessages: { [message: string]: number } = rawMessages.reduce((allMessages, message) => {
            if (allMessages[message] != null) {
                allMessages[message] += 1;
            } else {
                allMessages[message] = 1;
            }

            return allMessages;
        }, {});

        const highest = Math.max(...Object.values(raidMessages));
        const index = Object.values(raidMessages).findIndex(message => message === highest);

        return Object.keys(raidMessages)[index];
    }

    private async checkPreviousMessages(): Promise<void> {
        for (const message of this._messageCache) {
            if (message.rawText === this._raidMessage) {
                await this.handleRaider(message);
            }
        }
    }

    async sendMessageToCache(firebotChatMessage: FirebotChatMessage): Promise<void> {
        if (this._messageCache.length >= this._chatCacheLimit) {
            this._messageCache.shift();
        }

        if (firebotChatMessage.rawText.length > 10) {
            firebotChatMessage.rawText = firebotChatMessage.rawText.substr(10);
        }

        this._messageCache.push(firebotChatMessage);

        if (firebotChatMessage && this._checkerEnabled && firebotChatMessage.rawText === this._raidMessage) {
            await this.handleRaider(firebotChatMessage);
        }
    }

    async enable(shouldBan: boolean, shouldBlock: boolean): Promise<void> {
        this._raidMessage = this.getRaidMessage();
        this._settings.shouldBan = shouldBan;
        this._settings.shouldBlock = shouldBlock;

        await this.checkPreviousMessages();

        this._checkerEnabled = true;
        logger.debug("Raid message checker enabled");
    }

    disable(): void {
        this._checkerEnabled = false;
    }
}

const raidMessageChecker = new RaidMessageChecker();

export = raidMessageChecker;