import type { HelixEventSubSubscription } from "@twurple/api";
import { EventSubSubscription, EventSubBase } from "@twurple/eventsub-base";
import { rtfm } from "@twurple/common";

type EventData = {
    id: string;
    broadcaster_user_id: string;
    broadcaster_user_login: string;
    broadcaster_user_name: string;
    user_id: string;
    user_login: string;
    user_name: string;
    user_input: string;
    status: string;
    custom_power_up: {
        id: string;
        title: string;
        bits_cost: number;
        prompt: string;
    };
    redeemed_at: string;
};

@rtfm("eventsub-base", "EventSubSubscription")
export class EventSubPowerUpRedemptionAddSubscription extends EventSubSubscription<EventData> {
    readonly _cliName = "power-up-redemption-add";

    constructor(
        handler: (data: EventData) => void,
        client: EventSubBase,
        private readonly _broadcasterId: string
    ) {
        // @ts-ignore
        super(handler, client);
    }

    get id(): string {
        return `channel.custom_power_up_redemption.add.${this._broadcasterId}`;
    }

    get authUserId(): string | null {
        return this._broadcasterId;
    }

    protected transformData(data: EventData): EventData {
        return data;
    }

    protected async _subscribe(): Promise<HelixEventSubSubscription> {
        return this._client._config.managed
            ? await this._client._config.apiClient.asUser(
                this._broadcasterId,
                async ctx =>
                    await ctx.eventSub.createSubscription(
                        "channel.custom_power_up_redemption.add",
                        "beta",
                        {
                        // eslint-disable-next-line camelcase
                            broadcaster_user_id: this._broadcasterId
                        },
                        await this._getTransportOptions(),
                        this._broadcasterId,
                        ["bits:read"],
                        true
                    )
            )
            : undefined;
    }
}
