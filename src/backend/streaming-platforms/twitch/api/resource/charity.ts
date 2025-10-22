import { ApiResourceBase } from "./api-resource-base";
import { TwitchApiBase } from "../api";

export class TwitchCharityApi extends ApiResourceBase {
    constructor(apiBase: TwitchApiBase) {
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