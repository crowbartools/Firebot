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
    /*
      function that resolves/rejects a promise based on if the restriction critera is met
    */
    predicate: (triggerData) => {
        return new Promise((resolve, reject) => {
            const activeUserHandler = require("../../chat/chat-listeners/active-user-handler");
            const username = triggerData.metadata.username;

            if (activeUserHandler.userIsActive(username)) {
                resolve();
            } else {
                reject("You haven't sent a chat message recently");
            }
        });
    }

};

module.exports = model;