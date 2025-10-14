import { ApiClient } from "@twurple/api";
import { ApiResourceBase } from "./api-resource-base";
import accountAccess from "../../../../common/account-access";

export class TwitchCharityApi extends ApiResourceBase {
    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        super(streamerClient, botClient);
    }

    async getCurrentCharityFundraiserTotal(): Promise<number> {
        const streamerId = accountAccess.getAccounts().streamer.userId;

        const totalRaised = (await this._streamerClient.charity.getCharityCampaign(streamerId))?.currentAmount?.localizedValue;

        return totalRaised;
    }

    async getCurrentCharityFundraiserGoal(): Promise<number> {
        const streamerId = accountAccess.getAccounts().streamer.userId;

        const goal = (await this._streamerClient.charity.getCharityCampaign(streamerId))?.targetAmount?.localizedValue;

        return goal;
    }
}