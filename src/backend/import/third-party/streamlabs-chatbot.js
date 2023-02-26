"use strict";

const twitchApi = require("../../twitch-api/api");
const chatRolesManager = require("../../roles/chat-roles-manager");
const frontendCommunicator = require("../../common/frontend-communicator");
const logger = require("../../logwrapper");
const userDb = require("../../database/userDatabase");

const addViewersFromTwitch = async (viewers) => {
    let twitchViewers = [];

    const nameGroups = [];
    while (viewers.length > 0) {
        nameGroups.push(viewers.splice(0, 100));
    }

    for (const group of nameGroups) {
        try {
            const names = group.map(v => v.name);
            const response = await twitchApi.users.getUsersByNames(names);

            if (response) {
                twitchViewers = [
                    ...twitchViewers,
                    ...response
                ];
            }
        } catch (err) {
            logger.error("Failed to get users", { location: "/import/third-party/streamlabs.chatbot.js:35", err: err });

            if (err._statusCode === 400) {
                for (const viewer of group) {
                    try {
                        const response = await twitchApi.users.getUserByName(viewer.name);

                        if (response) {
                            twitchViewers.push(response);
                        }
                    } catch (err) {
                        logger.error("Failed to get user", { location: "/import/third-party/streamlabs.chatbot.js:46", err: err });
                    }
                }
            }
        }
    }

    const newViewers = [];
    for (const viewer of twitchViewers) {
        const roles = chatRolesManager.getUsersChatRoles(viewer.id);

        const newViewer = await userDb.createNewUser(
            viewer.id,
            viewer.name,
            viewer.displayName,
            viewer.profilePictureUrl,
            roles
        );

        if (newViewer) {
            newViewers.push(newViewer);
        } else {
            logger.error("Failed to create new user", { location: "/import/third-party/streamlabs.chatbot.js:68" });
        }
    }

    return newViewers || [];
};

const importViewers = async (data) => {
    logger.debug(`Attempting to import viewers...`);

    const { viewers, settings } = data;

    const newViewers = [];
    let viewersToUpdate = [];

    for (const v of viewers) {
        const viewer = await userDb.getUserByUsername(v.name);

        if (viewer == null) {
            newViewers.push(v);
            continue;
        }

        viewersToUpdate.push(viewer);
    }

    const createdViewers = await addViewersFromTwitch(newViewers);

    if (createdViewers.length) {
        viewersToUpdate = [
            ...viewersToUpdate,
            ...createdViewers
        ];
    }

    for (const viewer of viewersToUpdate) {
        const viewerToUpdate = viewer;
        const importedViewer = viewers.find(v => v.name.toLowerCase() === viewer.username.toLowerCase());

        if (settings.includeViewHours) {
            viewerToUpdate.minutesInChannel += importedViewer.viewHours * 60;
        }

        await userDb.updateUser(viewerToUpdate);
    }

    logger.debug(`Finished importing viewers`);
    return true;
};

const setupListeners = () => {
    frontendCommunicator.onAsync("importSlcbViewers", async data => importViewers(data));
};

exports.setupListeners = setupListeners;