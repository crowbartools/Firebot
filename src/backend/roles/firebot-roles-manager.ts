import { FirebotRole } from "../../types/roles";
import firebotRoles from "../../shared/firebot-roles";
import activeChatUsers from "../chat/chat-listeners/active-user-handler";

class FirebotRolesManager {
    private userIsInFirebotRole(role: FirebotRole, userIdOrName: string): boolean {
        switch (role.id) {
            case "ActiveChatters":
                return activeChatUsers.userIsActive(userIdOrName);
            default:
                return false;
        }
    }

    getAllFirebotRolesForViewer(userIdOrName: string): FirebotRole[] {
        const roles = firebotRoles.getFirebotRoles();
        return roles
            .filter(r => this.userIsInFirebotRole(r, userIdOrName) !== false)
            .map((r) => {
                return {
                    id: r.id,
                    name: r.name
                };
            });
    }
}

const firebotRolesManager = new FirebotRolesManager();

export = firebotRolesManager;