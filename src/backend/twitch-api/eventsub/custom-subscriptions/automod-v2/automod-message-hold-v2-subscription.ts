import type { HelixEventSubSubscription } from '@twurple/api';
import { EventSubSubscription, EventSubBase } from "@twurple/eventsub-base";
import { rtfm } from '@twurple/common';
import { EventSubAutoModMessageHoldV2EventData } from './automod-message-event-data';

@rtfm('eventsub-base', 'EventSubSubscription')
export class EventSubAutoModMessageHoldV2Subscription extends EventSubSubscription<EventSubAutoModMessageHoldV2EventData> {
    readonly _cliName = '';

    constructor(
        handler: (data: EventSubAutoModMessageHoldV2EventData) => void,
        client: EventSubBase,
        private readonly _broadcasterId: string,
        private readonly _moderatorId: string
    ) {
        // @ts-ignore
        super(handler, client);
    }

    get id(): string {
        return `automod.message.hold.v2.${this._broadcasterId}.${this._moderatorId}`;
    }

    get authUserId(): string | null {
        return this._moderatorId;
    }

    protected transformData(data: EventSubAutoModMessageHoldV2EventData): EventSubAutoModMessageHoldV2EventData {
        return data;
    }

    protected async _subscribe(): Promise<HelixEventSubSubscription> {
        return await this._client._apiClient.asUser(
            this._moderatorId,
            async ctx =>
                await ctx.eventSub.createSubscription('automod.message.hold',
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