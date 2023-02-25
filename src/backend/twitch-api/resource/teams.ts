import logger from "../../logwrapper";
import accountAccess from "../../common/account-access";
import { ApiClient, HelixTeam } from "@twurple/api";

export class TwitchTeamsApi {
    client: ApiClient;

    constructor(apiClient: ApiClient) {
        this.client = apiClient;
    }

    async getTeams(broadcasterId: string): Promise<HelixTeam[]> {
        try {
            const teams = await this.client.teams.getTeamsForBroadcaster(broadcasterId);

            if (teams != null) {
                return teams;
            }

            return [];
        } catch (error) {
            logger.error("Failed to get teams for broadcaster", error);
            return [];
        }
    }

    async getMatchingTeams(userId: string): Promise<HelixTeam[]> {
        const streamer = accountAccess.getAccounts().streamer;
        const streamerTeams = await this.getTeams(streamer.userId);
        const userTeams = await this.getTeams(userId);

        const teams = [];
        for (const streamerTeam of streamerTeams) {
            for (const userTeam of userTeams) {
                if (streamerTeam.id === userTeam.id) {
                    teams.push(streamerTeam);
                }
            }
        }

        return teams;
    }

    async getMatchingTeamsByName(username: string): Promise<HelixTeam[]> {
        try {
            const user = await this.client.users.getUserByName(username);

            if (user == null) {
                return null;
            }

            const teams = await this.getMatchingTeams(user.id);
            if (teams != null) {
                return teams;
            }

            return [];
        } catch (error) {
            logger.error("Failed to get teams for broadcaster", error);
            return [];
        }
    }

    async getMatchingTeamsById(userId: string): Promise<HelixTeam[]> {
        const teams = await this.getMatchingTeams(userId);

        if (teams != null) {
            return teams;
        }

        return [];
    }

    async getStreamerTeams(): Promise<HelixTeam[]> {
        const streamer = accountAccess.getAccounts().streamer;
        const streamerTeams = await this.getTeams(streamer.userId);

        if (streamerTeams != null) {
            return streamerTeams;
        }

        return [];
    }
};