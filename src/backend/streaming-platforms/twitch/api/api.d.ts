import { ApiClient } from "@twurple/api";
import { FirebotAccount } from "../../../../types/accounts";
import logger from "../../../logwrapper";

export type TwitchApiBase = {
    streamerClient: ApiClient;
    botClient: ApiClient;
    accounts: {
        streamer: FirebotAccount;
        bot: FirebotAccount;
    };
    logger: typeof logger;
};