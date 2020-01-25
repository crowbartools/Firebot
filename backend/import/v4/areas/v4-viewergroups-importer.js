"use strict";

const path = require("path");
const logger = require("../../../logwrapper");
const uuid = require("uuid/v1");
const importHelpers = require("../import-helpers");

const customRolesManager = require("../../../roles/custom-roles-manager");

async function checkForV4ViewerGroups() {
    const v4ViewerGroupsPath = path.join(importHelpers.v4DataPath, "/groups.json");
    const v4ViewerGroupsDetected = await importHelpers.pathExists(v4ViewerGroupsPath);
    return v4ViewerGroupsDetected;
}

exports.run = async () => {
    let incompatibilityWarnings = [];

    let v4ViewerGroupsExist = await checkForV4ViewerGroups();

    if (v4ViewerGroupsExist) {
        let v4ViewerGroupsObj;
        try {
            let v4ViewerGroupsDb = importHelpers.getJsonDbInV4Data("/groups.json");
            v4ViewerGroupsObj = v4ViewerGroupsDb.getData("/");
        } catch (err) {
            logger.warn("Error while attempting to load v4 events db.", err);
        }

        if (v4ViewerGroupsObj != null) {
            let viewerGroups = Object.values(v4ViewerGroupsObj) || [];
            viewerGroups = viewerGroups.filter(g => g.groupName !== "banned");

            for (let viewerGroup of viewerGroups) {
                let customRole = {
                    id: uuid(),
                    name: viewerGroup.groupName,
                    viewers: viewerGroup.users
                };

                customRolesManager.saveCustomRole(customRole);
            }

            customRolesManager.triggerUiRefresh();
        }
    }

    return {
        success: true,
        incompatibilityWarnings: incompatibilityWarnings
    };
};