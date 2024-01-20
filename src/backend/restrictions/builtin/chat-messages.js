"use strict";

const model = {
    definition: {
        id: "firebot:chatMessages",
        name: "Chat Messages",
        description: "Restricts to users who have sent a certain number of chat messages.",
        triggers: []
    },
    optionsTemplate: `
        <div>
            <div id="chatMessageRestriction" class="modal-subheader" style="padding: 0 0 4px 0">
                Minimum # of Messages
            </div>
            <input type="number" class="form-control" placeholder="0" ng-model="restriction.messages">
        </div>
    `,
    optionsValueDisplay: (restriction) => {
        const messages = restriction.messages || 0;

        return `${messages}+`;
    },
    /*
      function that resolves/rejects a promise based on if the restriction criteria is met
    */
    predicate: (triggerData, restrictionData) => {
        return new Promise(async (resolve, reject) => {
            let passed = false;
            const viewerDatabase = require('../../viewers/viewer-database');
            const viewer = await viewerDatabase.getViewerByUsername(triggerData.metadata.username);
            const chatMessages = viewer.chatMessages;

            if (chatMessages >= restrictionData.messages) {
                passed = true;
            }

            if (passed) {
                resolve();
            } else {
                reject("You have not sent enough chat messages in this channel");
            }
        });
    }
};

module.exports = model;