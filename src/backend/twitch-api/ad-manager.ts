import { DateTime } from "luxon";

import logger from "../logwrapper";
import accountAccess from "../common/account-access";
import twitchApi from "./api";
import frontendCommunicator from "../common/frontend-communicator";
import { SettingsManager } from "../common/settings-manager";
import eventManager from "../events/EventManager";

class AdManager {
    private _adCheckIntervalId: NodeJS.Timeout;
    private _nextAdBreak: DateTime = null;
    private _isAdCheckRunning = false;
    private _upcomingEventTriggered = false;
    private _isAdRunning = false;

    constructor() {
        frontendCommunicator.on("ad-manager:refresh-ad-schedule", async () => {
            await this.runAdCheck();
        });
    }

    get secondsUntilNextAdBreak(): number {
        return this._nextAdBreak != null
            ? Math.round(Math.abs(this._nextAdBreak.diffNow("seconds").seconds))
            : 0;
    }

    get isAdBreakRunning(): boolean {
        return this._isAdRunning === true;
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
            this._nextAdBreak = DateTime.fromJSDate(adSchedule.nextAdDate);

            frontendCommunicator.send("ad-manager:next-ad", {
                nextAdBreak: adSchedule.nextAdDate,
                duration: adSchedule.duration
            });

            const upcomingTriggerMinutes = Number(SettingsManager.getSetting("TriggerUpcomingAdBreakMinutes"));
            const minutesUntilNextAdBreak = this.secondsUntilNextAdBreak / 60;

            if (upcomingTriggerMinutes > 0
                && this._upcomingEventTriggered !== true
                && minutesUntilNextAdBreak <= (upcomingTriggerMinutes + 1)
            ) {
                this._upcomingEventTriggered = true;

                /**
                 * Adding some precision to the upcoming ad break event
                 * If we're past the threshold already, trigger immediately
                 * Otherwise, get as close to the threshold as possible
                 */
                let timeout = 1;
                if (minutesUntilNextAdBreak > upcomingTriggerMinutes) {
                    timeout = (this.secondsUntilNextAdBreak - (upcomingTriggerMinutes * 60)) * 1000;
                }

                setTimeout(() => {
                    eventManager.triggerEvent("twitch", "ad-break-upcoming", {
                        secondsUntilNextAdBreak: this.secondsUntilNextAdBreak,
                        adBreakDuration: adSchedule.duration
                    });
                }, timeout);
            }
        } else {
            this._nextAdBreak = null;
            frontendCommunicator.send("ad-manager:hide-ad-break-timer");
        }

        logger.debug("Ad timer check complete.");
        this._isAdCheckRunning = false;
    }

    triggerAdBreakStart(duration: number, endsAt: Date) {
        this._isAdRunning = true;
        frontendCommunicator.send("ad-manager:ad-running", {
            duration,
            endsAt
        });
    }

    triggerAdBreakComplete(): void {
        this._upcomingEventTriggered = false;
        this._isAdRunning = false;
        this.runAdCheck();
    }

    async startAdCheck(): Promise<void> {
        if (this._adCheckIntervalId == null) {
            await this.runAdCheck();

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