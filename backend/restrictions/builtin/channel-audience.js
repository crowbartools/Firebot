"use strict";

const model = {
    definition: {
        id: "firebot:channel-audience",
        name: "Channel Audience",
        description: "Restricts based on the current channel audience (Family/Teen/18+).",
        hidden: true,
        triggers: []
    },
    optionsTemplate: `
        <div>
            <div class="alert alert-danger">
                This restriction only worked on Mixer. It now does nothing and can be removed.
            </div>
        </div>
    `,
    optionsController: () => {},
    optionsValueDisplay: () => "",
    predicate: () => {
        return Promise.resolve();
    },
    onSuccessful: () => {}
};

module.exports = model;