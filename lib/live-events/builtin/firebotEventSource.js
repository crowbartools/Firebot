"use strict";

/**
 * The firebot event source
 */
const firebotEventSource = {
  id: "firebot",
  name: "Firebot",
  description: "Various events that can happen within Firebot.",
  events: [
    {
      id: "mixplay-connected",
      name: "MixPlay Connected",
      description:
        "When Firebot connects to MixPlay and controls become available to use.",
      cached: false,
      manualMetadata: {
        username: "Firebot"
      }
    },
    {
      id: "chat-connected",
      name: "Chat Connected",
      description: "When Firebot connects to Mixer Chat.",
      cached: false,
      manualMetadata: {
        username: "Firebot"
      }
    }
  ]
};

module.exports = firebotEventSource;
