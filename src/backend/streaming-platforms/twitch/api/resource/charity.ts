import { ApiResourceBase } from "./api-resource-base";
import type { TwitchApi } from "../";

export class TwitchCharityApi extends ApiResourceBase {
    constructor(apiBase: typeof TwitchApi) {
        super(apiBase);
    }

    async getCurrentCharityFundraiserTotal(): Promise<number> {
        const streamerId = this.accounts.streamer.userId;

        const totalRaised = (await this.streamerClient.charity.getCharityCampaign(streamerId))?.currentAmount?.localizedValue;

        return totalRaised;
    }

    async getCurrentCharityFundraiserGoal(): Promise<number> {
        const streamerId = this.accounts.streamer.userId;

        const goal = (await this.streamerClient.charity.getCharityCampaign(streamerId))?.targetAmount?.localizedValue;

        return goal;
    }
}