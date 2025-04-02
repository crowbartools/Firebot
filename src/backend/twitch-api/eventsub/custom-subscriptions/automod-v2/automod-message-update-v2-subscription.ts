import type { HelixEventSubSubscription } from '@twurple/api';
import { EventSubSubscription, EventSubBase } from "@twurple/eventsub-base";
import { rtfm } from '@twurple/common';
import { EventSubAutoModMessageUpdateV2EventData } from './automod-message-event-data';

@rtfm('eventsub-base', 'EventSubSubscription')
export class EventSubAutoModMessageUpdateV2Subscription extends EventSubSubscription<EventSubAutoModMessageUpdateV2EventData> {
    readonly _cliName = '';

    constructor(
        handler: (data: EventSubAutoModMessageUpdateV2EventData) => void,
        client: EventSubBase,
        private readonly _broadcasterId: string,
        private readonly _moderatorId: string
    ) {
        // @ts-ignore
        super(handler, client);
    }

    get id(): string {
        return `automod.message.update.v2.${this._broadcasterId}.${this._moderatorId}`;
    }

    get authUserId(): string | null {
        return this._moderatorId;
    }

    protected transformData(data: EventSubAutoModMessageUpdateV2EventData): EventSubAutoModMessageUpdateV2EventData {
        return data;
    }

    protected async _subscribe(): Promise<HelixEventSubSubscription> {
        return await this._client._apiClient.asUser(
            this._moderatorId,
            async ctx =>
                await ctx.eventSub.createSubscription('automod.message.update',
                    '2',
                    {
                        // eslint-disable-next-line camelcase
                        broadcaster_user_id: this._broadcasterId,
                        // eslint-disable-next-line camelcase
                        moderator_user_id: this._broadcasterId
                    },
                    await this._getTransportOptions(),
                    this._broadcasterId,
                    ['moderator:manage:automod'],
                    true
                ));
    }
}