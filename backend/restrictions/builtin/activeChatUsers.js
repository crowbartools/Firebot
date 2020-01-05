"use strict";

const profileManager = require("../../common/profile-manager");

const model = {
    definition: {
        id: "firebot:activeChatUsers",
        name: "Active Chatters",
        description: "Restricts to only active chat users.",
        triggers: []
    },
    optionsTemplate: `
        <div>
            <div id="chatterRestriction" class="mixplay-header" style="padding: 0 0 4px 0">
                Active Chatter Restriction
            </div>
            <div class="">
                <p>This limits this action to only active chatters. People who haven't chatted, or those who have become "inactive" based on your user settings, will not be able to use the action.</p>
            </div>
        </div>
    `,
    optionsController: ($scope) => {

    },
    optionsValueDisplay: (restriction) => {
        return "Active chatters only.";
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
                reject("You haven't sent a chat message recently.");
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