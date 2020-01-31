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
        return new Promise(async (resolve, reject) => {
            let passed = false;
            let activeChatter = require('../../../backend/chat/active-chatters');
            let activeChatList = activeChatter.getActiveChatters();
            let username = triggerData.metadata.username;

            let newActiveUserArray = activeChatList.filter(chatter => chatter.username === username);

            if (newActiveUserArray.length > 0) {
                passed = true;
            }

            if (passed) {
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