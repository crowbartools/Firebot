import type { SharedChatParticipant } from '../../../../types';
import { TwitchApi } from "../api";

class SharedChatCache {
    private _isActive = false;
    private _participants: Record<string, SharedChatParticipant> = {};

    get isActive(): boolean {
        return this._isActive;
    }

    enableSharedChat() {
        this._isActive = true;
    }

    disableSharedChat() {
        this._isActive = false;
        this._participants = {};
    }

    get participants(): Record<string, SharedChatParticipant> {
        return this._participants;
    }

    set participants(participants: Array<SharedChatParticipant>) {
        this._participants = {};
        for (const participant of participants) {
            this._participants[participant.broadcasterId] = participant;
        }
    }

    async loadSessionFromTwitch() {
        const participants = await TwitchApi.chat.getSharedChatParticipants();
        if (!participants) {
            this.disableSharedChat();
            return;
        }

        this.enableSharedChat();
        this.participants = participants;
    }
}

const cache = new SharedChatCache();

export { cache as SharedChatCache };