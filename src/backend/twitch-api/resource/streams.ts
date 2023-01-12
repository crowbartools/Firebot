import logger from '../../logwrapper';
import twitchApi from "../api";
import accountAccess from "../../common/account-access";
import { ApiClient } from "@twurple/api";

export async function createStreamMarker(descriotion?: string): Promise<void> {
    try {
        const client: ApiClient = twitchApi.getClient();
        const streamerId = accountAccess.getAccounts().streamer.userId;

        await client.streams.createStreamMarker(streamerId, descriotion);
    } catch (error) {
        logger.error(`Failed to create stream marker`, error);
    }
};