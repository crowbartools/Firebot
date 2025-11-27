import { HelixTeam } from "@twurple/api";
import { ApiResourceBase } from "./api-resource-base";
import type { TwitchApi } from "../";

export class TwitchTeamsApi extends ApiResourceBase {
    constructor(apiBase: typeof TwitchApi) {
        super(apiBase);
    }

    async getTeams(broadcasterId: string): Promise<HelixTeam[]> {
        try {
            const teams = await this.streamerClient.teams.getTeamsForBroadcaster(broadcasterId);

            if (teams != null) {
                return teams;
            }

            return [];
        } catch (error) {
            this.logger.error(`Failed to get teams for broadcaster: ${(error as Error).message}`);
            return [];
        }
    }

    async getMatchingTeams(userId: string): Promise<HelixTeam[]> {
        const streamer = this.accounts.streamer;
        const streamerTeams = await this.getTeams(streamer.userId);
        const userTeams = await this.getTeams(userId);

        const teams: HelixTeam[] = [];
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
            const user = await this.streamerClient.users.getUserByName(username);

            if (user == null) {
                return null;
            }

            const teams = await this.getMatchingTeams(user.id);
            if (teams != null) {
                return teams;
            }

            return [];
        } catch (error) {
            this.logger.error(`Failed to get teams for broadcaster: ${(error as Error).message}`);
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
        const streamer = this.accounts.streamer;

        if (!streamer?.loggedIn) {
            this.logger.warn("Cannot get streamer's teams. Streamer is not currently logged in,");
            return [];
        }

        const streamerTeams = await this.getTeams(streamer.userId);

        if (streamerTeams != null) {
            return streamerTeams;
        }

        return [];
    }
}