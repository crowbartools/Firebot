"use strict";
const EventEmitter = require("events");
const EventSource = require("eventsource");
const slootsEventHandler = require("./streamloots-event-handler");
const slootsVariableLoader = require("./variables/streamloots-variable-loader");
const slootsFilterLoader = require("./filters/streamloots-filter-loader");

const integrationDefinition = {
    id: "streamloots",
    name: "StreamLoots",
    description: "Purchase/Redemption events",
    linkType: "id"
};

class StreamLootsIntegration extends EventEmitter {
    constructor() {
        super();
        this.connected = false;
        this._eventSource = null;
    }
    init() {
        slootsEventHandler.registerEvents();
        slootsVariableLoader.registerVariables();
        slootsFilterLoader.registerFilters();
    }
    connect(integrationData) {
        let { accountId } = integrationData;

        if (accountId == null) {
            this.emit("disconnected", integrationDefinition.id);
            this.connected = false;
            return;
        }

        this._eventSource = new EventSource(`https://widgets.streamloots.com/alerts/${accountId}/media-stream`);

        this._eventSource.onmessage = (event) => {
            if (event.data) {
                let parsedData = JSON.parse(event.data);
                slootsEventHandler.processStreamLootsEvent(parsedData);
            }
        };

        this._eventSource.onerror = function(err) {
            console.error("Streamloots eventsource failed:", err);
            this.emit("disconnected", integrationDefinition.id);
            this.connected = false;
            return;
        };

        this.emit("connected", integrationDefinition.id);
        this.connected = true;

    }
    disconnect() {
        if (this._eventSource) {
            this._eventSource.close();
            this.connected = false;
        }

        this.emit("disconnected", integrationDefinition.id);
    }
    link() {
    }
    unlink() {
        if (this._eventSource) {
            this._eventSource.close();
            this.connected = false;
            this.emit("disconnected", integrationDefinition.id);
        }
    }
}

const integration = new StreamLootsIntegration();

module.exports = {
    definition: integrationDefinition,
    integration: integration
};
