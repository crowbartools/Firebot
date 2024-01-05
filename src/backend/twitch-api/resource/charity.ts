import accountAccess from "../../common/account-access";
import logger from '../../logwrapper';
import { ApiClient } from "@twurple/api";

export class TwitchCharityApi {
    private _streamerClient: ApiClient;
    private _botClient: ApiClient;

    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        this._streamerClient = streamerClient;
        this._botClient = botClient;
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