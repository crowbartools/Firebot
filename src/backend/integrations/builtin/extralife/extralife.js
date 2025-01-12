"use strict";
const EventEmitter = require("events");
const { extraLifePollService } = require("./extralife-poll");
const extraLifeVariableLoader = require("./variables/extralife-variable-loader");

const integrationDefinition = {
    id: "extralife",
    name: "ExtraLife",
    description: "ExtraLife Donation events",
    connectionToggle: true,
    linkType: "id",
    idDetails: {
        steps:
`1. Navigate to your ExtraLife Page via the **Your Page** nav link.

2. Look for your "Participant ID" in the URL bar, it should be the numbers following \`participantID=\`.

3. Paste your Participant ID below.`
    }
};

class ExtraLifeIntegration extends EventEmitter {
    constructor() {
        super();
        this.connected = false;
    }
    init() {
        const eventManager = require("../../../events/EventManager");
        eventManager.registerEventSource({
            id: "extralife",
            name: "ExtraLife",
            description: "Donation events from ExtraLife",
            events: [
                {
                    id: "donation",
                    name: "Donation",
                    description: "When someone donates to your ExtraLife campaign.",
                    cached: false,
                    manualMetadata: {
                        from: "ExtraLife",
                        formattedDonationAmount: 5,
                        donationAmount: 5,
                        donationMessage: "Test message"
                    },
                    isIntegration: true,
                    queued: true,
                    activityFeed: {
                        icon: "fad fa-money-bill",
                        getMessage: (eventData) => {
                            return `**${eventData.from}** donated **${eventData.formattedDonationAmount}** to ExtraLife${eventData.donationMessage && !!eventData.donationMessage.length ? `: *${eventData.donationMessage}*` : ''}`;
                        }
                    }
                }
            ]
        });

        extraLifeVariableLoader.registerVariables();

        extraLifePollService.on("connected", () => {
            this.connected = true;
            this.emit("connected", integrationDefinition.id);
        });

        extraLifePollService.on("disconnected", () => {
            if (!this.connected) {
                return;
            }
            this.disconnect();
        });
    }
    connect(integrationData) {
        let { accountId } = integrationData;

        accountId = accountId?.replace("https://www.extra-life.org/index.cfm?fuseaction=donordrive.participant&participantID=", "");

        if (accountId == null || isNaN(accountId)) {
            this.emit("disconnected", integrationDefinition.id);
            this.connected = false;
            return;
        }

        extraLifePollService.start(accountId);
    }
    disconnect() {
        this.connected = false;
        extraLifePollService.stop();
        this.emit("disconnected", integrationDefinition.id);
    }
    link() {}
    unlink() {
        if (this.connected) {
            this.connected = false;
            this.emit("disconnected", integrationDefinition.id);
        }
        extraLifePollService.stop();
    }
}

const integration = new ExtraLifeIntegration();

module.exports = {
    definition: integrationDefinition,
    integration: integration
};
