"use strict";
const io = require("socket.io-client");

const EVENT_SOURCE_ID = "streamlabs";
const EventId = {
  DONATION: "donation"
};

let socket = null;

const streamlabs = {
  connect: tokens => {
    const eventManager = require("../EventManager");
    socket = io(`https://sockets.streamlabs.com?token=${tokens.socketToken}`, {
      transports: ["websocket"]
    });

    socket.on("event", eventData => {
      console.log(eventData);
      if (eventData === null) return;
      if (eventData.type === "donation") {
        let donoData = eventData.message[0];
        eventManager.triggerEvent(EVENT_SOURCE_ID, EventId.DONATION, {
          formattedDonationAmmount: donoData.formatted_amount,
          dononationAmount: donoData.amount,
          donationMessage: donoData.message,
          from: donoData.from
        });
      }
    });

    console.log("listening for events...");
  },
  disconnect: () => {
    socket = null;
  },
  connected: () => socket != null,
  eventSourceDefinition: {
    id: EVENT_SOURCE_ID,
    name: "Streamlabs",
    description: "Donation events from Streamlabs",
    events: [
      {
        id: EventId.DONATION,
        name: "Donation",
        description: "When someone donates to you.",
        cached: false,
        queued: true
      }
    ]
  }
};

module.exports = streamlabs;
