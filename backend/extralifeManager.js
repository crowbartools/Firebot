"use strict";
const {ipcMain} = require("electron");
const settings = require("./common/settings-access").settings;
const request = require("request");
const { LiveEvent, EventType, EventSourceType } = require('./live-events/EventType');
const eventRouter = require('./live-events/events-router');
const logger = require("./logwrapper");
const crypto = require("crypto");

let pollId;

let donationCache = {};

let participantId = null;

// create a more unique key for the cache
function getDonoKey(donation) {
    let donoData = donation.displayName + donation.donorID + donation.amount;
    let hashKey = crypto.createHash('md5').update(donoData).digest("hex");
    return hashKey;
}

function cacheDonation(donation) {
    let hashKey = getDonoKey(donation);
    donationCache[hashKey] = donation;
}

function donationIsCached(donation) {
    let hashKey = getDonoKey(donation);
    return donationCache[hashKey] != null;
}

function handleDonation(donation) {
    let isCached = donationIsCached(donation);

    if (!isCached) {
        // cache it
        cacheDonation(donation);

        // run firebot event
        let event = new LiveEvent(EventType.EXTRALIFE_DONATION, EventSourceType.EXTRALIFE, {username: donation.displayName, data: donation});
        eventRouter.uncachedEvent(event);
    }
}

function getDonations() {
    return new Promise(resolve => {

        logger.info("Getting ExtraLife Donations...");

        const url = `https://www.extra-life.org/api/participants/${participantId}/donations`;

        request.get(url, (error, resp, body) => {
            if (error) {
                // do something
                logger.error("Error while getting extra life donations", error);
                return;
            }
            let donations = JSON.parse(body);
            resolve(donations);
        });
    });
}

function poll() {
    getDonations().then(donations => {
        donations.forEach(handleDonation);
    });
}

async function startPoll() {
    if (pollId != null) {
        clearInterval(pollId);
    }

    let donations = await getDonations();

    // cache current donations
    donations.forEach(cacheDonation);

    pollId = setInterval(poll, 15000);
}

function stopPoll() {
    if (pollId != null) {
        clearInterval(pollId);
    }
}

function start() {
    logger.info("Starting ExtraLife poll...");
    participantId = settings.getExtraLifeParticipantId();

    if (participantId == null || participantId.length < 1) {
        logger.info("No ExtraLife Id available. Stopping poll.");
        // stop interval if its running
        stopPoll();
    } else {
        // start interval
        startPoll();
    }
}

ipcMain.on('extraLifeIdUpdated', () => {
    logger.info("ExtraLife Id updated, restarting poll.");
    start();
});

exports.start = start;



