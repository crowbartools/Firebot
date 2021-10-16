"use strict";

const model = {
    definition: {
        id: "firebot:activeChatUsers",
        name: "Active Chat Users",
        description: "Restricts to only active chat users.",
        triggers: []
    },
    optionsTemplate: `
        <div>
            <div>
                <p>Limits to only active chat users (someone who has chatted recently)</p>
            </div>
        </div>
    `,
    optionsController: ($scope) => {

    },
    optionsValueDisplay: (restriction) => {
        return "";
    },
    /*
      function that resolves/rejects a promise based on if the restriction critera is met
    */
    predicate: (triggerData, restrictionData) => {
        return new Promise((resolve, reject) => {
            const activeUserHandler = require("../../chat/chat-listeners/active-user-handler");
            let username = triggerData.metadata.username;

            if (activeUserHandler.userIsActive(username)) {
                resolve();
            } else {
                reject("You haven't sent a chat message recently");
            }
        });
    },
    /*
        called after all restrictions in a list are met. Do logic such as deducting currency here.
    */
    onSuccessful: (triggerData, restrictionData) => {

    }

};

module.exports = model;