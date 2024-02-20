import { FirebotRole } from "../../types/roles";
import twitchApi from "../twitch-api/api";
import frontendCommunicator from "../common/frontend-communicator";

interface TwitchTeam {
    mappedRole: {
        id: string;
        name: string;
    },
    members: Array<{
        id: string;
        username: string;
        displayName: string;
    }>
}

class TeamRolesManager {
    private _streamerTeams: TwitchTeam[] = [];

    constructor() {
        frontendCommunicator.onAsync("get-team-roles", async () => {
            if (this._streamerTeams == null) {
                return [];
            }

            const roles = await this.getTeamRoles();
            return roles;
        });
    }

    async loadTeamRoles(): Promise<void> {
        const roles = await twitchApi.teams.getStreamerTeams();

        if (!roles?.length) {
            this._streamerTeams = null;
            return;
        }

        roles.forEach(async (team) => {
            const members = await team.getUserRelations();
            this._streamerTeams.push({
                mappedRole: {
                    id: team.id,
                    name: team.displayName
                },
                members: members.map((m) => {
                    return {
                        id: m.id,
                        username: m.name,
                        displayName: m.displayName
                    };
                })
            });
        });
    }

    async getTeamRoles(): Promise<FirebotRole[]> {
        if (this._streamerTeams == null) {
            return [];
        }

        if (!this._streamerTeams.length) {
            await this.loadTeamRoles();
        }

        return this._streamerTeams.map(team => team.mappedRole);
    }

    async getAllTeamRolesForViewer(userIdOrName: string): Promise<FirebotRole[]> {
        if (this._streamerTeams == null) {
            return [];
        }

        const teams: FirebotRole[] = [];
        this._streamerTeams.forEach((team) => {
            if (team.members.some(m => m.id.toLowerCase() === userIdOrName.toLowerCase()
                || m.username.toLowerCase() === userIdOrName.toLowerCase())) {
                teams.push(team.mappedRole);
            }
        });

        return teams;
    }
}

const teamRolesManager = new TeamRolesManager();

export = teamRolesManager;