import logger from "../logwrapper";
import accountAccess from "../common/account-access";
import twitchApi from "./api";
import frontendCommunicator from "../common/frontend-communicator";

class AdManager {
    private _adCheckIntervalId: NodeJS.Timeout;
    private _isAdCheckRunning = false;
    private _isAdRunning = false;

    constructor() {
        frontendCommunicator.on("ad-manager:refresh-ad-schedule", async () => {
            await this.runAdCheck();
        });
    }

    async runAdCheck(): Promise<void> {
        if (this._isAdCheckRunning === true) {
            return;
        }

        if (this._isAdRunning) {
            logger.debug("Ad break currently running. Skipping ad timer check.");
            return;
        }

        const streamer = accountAccess.getAccounts().streamer;
        if (streamer.broadcasterType === "") {
            logger.debug("Streamer is not affiliate/partner. Skipping ad timer check.");
            return;
        }

        this._isAdCheckRunning = true;
        logger.debug("Starting ad timer check.");

        const adSchedule = await twitchApi.channels.getAdSchedule();

        if (adSchedule?.nextAdDate != null) {
            frontendCommunicator.send("ad-manager:next-ad", {
                nextAdBreak: adSchedule.nextAdDate,
                duration: adSchedule.duration
            });
        }

        logger.debug("Ad timer check complete.");
        this._isAdCheckRunning = false;
    }

    triggerAdBreak(duration: number, endsAt: Date) {
        this._isAdRunning = true;
        frontendCommunicator.send("ad-manager:ad-running", {
            duration,
            endsAt
        });
    }

    triggerAdBreakComplete(): void {
        this._isAdRunning = false;
        this.runAdCheck();
    }

    startAdCheck(): void {
        if (this._adCheckIntervalId == null) {
            this._adCheckIntervalId = setInterval(async () => {
                await this.runAdCheck();
            }, 15 * 1000);
        }
    }

    stopAdCheck(): void {
        if (this._adCheckIntervalId != null) {
            clearInterval(this._adCheckIntervalId);
            this._adCheckIntervalId = null;
        }
    }
}

const adManager = new AdManager();

export = adManager;