import type { FirebotRole } from "../../types";

import { TwitchApi } from "../streaming-platforms/twitch/api";
import frontendCommunicator from "../common/frontend-communicator";
import { LoggerCache } from "../logger-cache";

interface TwitchTeam {
    mappedRole: {
        id: string;
        name: string;
    };
    members: Array<{
        id: string;
        username: string;
        displayName: string;
    }>;
}

class TeamRolesManager {
    private logger = LoggerCache.getLogger("Roles");
    private _streamerTeams: TwitchTeam[] = [];

    constructor() {
        frontendCommunicator.onAsync("team-roles:ui-service-ready",
            async () => await this.triggerUiRefresh()
        );

        frontendCommunicator.onAsync("get-team-roles", async () => {
            if (this._streamerTeams == null) {
                return [];
            }

            const roles = await this.getTeamRoles();
            return roles;
        });
    }

    async loadTeamRoles(): Promise<void> {
        const roles = await TwitchApi.teams.getStreamerTeams();

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

    async triggerUiRefresh(): Promise<void> {
        this.logger.debug("Triggering team role UI refresh");

        let roles: Array<FirebotRole>;

        if (this._streamerTeams == null) {
            roles = [];
        } else {
            roles = await this.getTeamRoles();
        }

        frontendCommunicator.send("team-roles:team-roles-updated", roles);
    }
}

const teamRolesManager = new TeamRolesManager();

export = teamRolesManager;