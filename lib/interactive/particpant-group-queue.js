"use strict";

const logger = require('../logwrapper');
const Interactive = require("../common/mixer-interactive");

let queueRunning = false;
let groupChangeQueue = [];

async function runQueue() {
    //ensure queue is marked as running
    queueRunning = true;
    logger.debug("Running group change queue cycle...");

    let originalQueueSize = groupChangeQueue.length;
    // grab next batch up to 500 in size
    let nextBatch = groupChangeQueue.splice(0, 500);
    logger.debug(`Attempting to update ${nextBatch.length} participant(s) out of ${originalQueueSize} in queue.`);

    // change group for next queue batch
    let participants = [];
    for (let data of nextBatch) {
        let participant = data.participant;
        participant.groupID = data.groupId;
        participants.push(participant);
    }

    try {
        await Interactive.updateParticipants(participants);
        logger.info(`Updated ${participants.length} participant(s).`);
    } catch (e) {
        logger.error(`Failed to update ${participants.length} participant(s)`, e);
    }

    //check if queue is done
    if (groupChangeQueue.length < 1) {
        //if it is, update running flag
        queueRunning = false;
        logger.debug("No more participants. Stopping group change queue.");
    } else {
        //if not, run next cycle in 100 mils
        logger.debug("There are more participants in the queue. Running next queue cycle in 100 mils.");
        setTimeout(runQueue, 100);
    }
}

function triggerQueue() {
    // if queue is already running, stop
    if (queueRunning) return;

    //if theres nothing in the queue then no need to start
    if (groupChangeQueue.length < 1) return;

    //start queue
    queueRunning = true;
    logger.debug("Starting the group change queue...");
    setTimeout(runQueue, 75);
}

function queueParticipantForGroupChange(participant, groupId) {
    if (groupId === "None") return;

    logger.debug(`Attempting to move ${participant.username} to group ${groupId}...`);

    let changeGroupData = {
        participant: participant,
        groupId: groupId
    };

    groupChangeQueue.push(changeGroupData);
    triggerQueue();
}

exports.queueParticipantForGroupChange = queueParticipantForGroupChange;