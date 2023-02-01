import twitchApi from "../api";
import accountAccess from "../../common/account-access";
import logger from "../../logwrapper";
import { HelixUserBlockAdditionalInfo, UserIdResolvable } from "@twurple/api";

export async function getFollowDateForUser(username: string): Promise<Date> {
    const client = twitchApi.getClient();
    const streamerData = accountAccess.getAccounts().streamer;

    const userId = (await client.users.getUserByName(username)).id;

    const followData = await client.users.getFollowFromUserToBroadcaster(userId, streamerData.userId);

    if (followData == null) {
        return null;
    }

    return followData.followDate;
};

export async function doesUserFollowChannel(username: string, channelName: string): Promise<boolean> {
    if (username == null || channelName == null) {
        return false;
    }

    const client = twitchApi.getClient();

    if (username.toLowerCase() === channelName.toLowerCase()) {
        return true;
    }

    const [user, channel] = await client.users.getUsersByNames([username, channelName]);

    if (user.id == null || channel.id == null) {
        return false;
    }

    const userFollow = await client.users.userFollowsBroadcaster(user.id, channel.id);

    return userFollow ?? false;
};

export async function blockUser(username: UserIdResolvable, reason?: 'spam' | 'harassment' | 'other'): Promise<boolean> {
    if (username == null) {
        return false;
    }

    const client = twitchApi.getClient();

    try {
        await client.users.createBlock(username, {
            reason
        });
    } catch (error) {
        logger.error("Error blocking user", error);
        return false;
    }

    return true;
};