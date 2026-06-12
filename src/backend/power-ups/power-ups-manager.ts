import { JsonDB } from "node-json-db";

import type {
    EffectList,
    PowerUpRedemptionMetadata,
    SavedPowerUp,
    Trigger
} from "../../types";
import type { CustomPowerUp } from "../streaming-platforms/twitch/api/resource/power-ups";

import { AccountAccess } from "../common/account-access";
import { ActiveUserHandler } from "../chat/active-user-handler";
import { ProfileManager } from "../common/profile-manager";
import { TwitchApi } from "../streaming-platforms/twitch/api";
import effectRunner from "../common/effect-runner";
import frontendCommunicator from "../common/frontend-communicator";
import { LoggerCache } from "../logger-cache";

class PowerUpsManager {
    private logger = LoggerCache.getLogger("Power-Ups");
    powerUps: Record<string, SavedPowerUp> = {};

    constructor() {
        frontendCommunicator.on("power-ups:get-all", () => Object.values(this.powerUps));
        frontendCommunicator.onAsync("power-ups:get-all", async () => Object.values(this.powerUps));

        frontendCommunicator.onAsync("power-ups:save", async (powerUp: SavedPowerUp) => this.savePowerUp(powerUp));

        frontendCommunicator.onAsync(
            "power-ups:save-all",
            async (powerUps: SavedPowerUp[]) => await this.saveAllPowerUps(powerUps)
        );

        frontendCommunicator.onAsync("power-ups:sync", async (): Promise<SavedPowerUp[]> => {
            await this.loadPowerUps();
            return Object.values(this.powerUps);
        });

        frontendCommunicator.on("power-ups:manually-trigger", (powerUpId: string) => {
            const savedPowerUp = this.powerUps[powerUpId];

            if (savedPowerUp == null) {
                return;
            }

            // Manually triggered by streamer, must pass in userId and userDisplayName can be falsy
            void this.triggerPowerUp(
                powerUpId,
                {
                    messageText: "Testing power-up",
                    powerUpId: savedPowerUp.id,
                    bits: savedPowerUp.twitchData.bits,
                    powerUpImage: savedPowerUp.twitchData.image
                        ? savedPowerUp.twitchData.image.url4x
                        : savedPowerUp.twitchData.defaultImage.url4x,
                    powerUpName: savedPowerUp.twitchData.title,
                    username: AccountAccess.getAccounts().streamer.displayName,
                    userId: "",
                    userDisplayName: ""
                },
                true
            );
        });
    }

    getPowerUpsDb(): JsonDB {
        return ProfileManager.getJsonDbInProfile("power-ups");
    }

    async loadPowerUps() {
        this.logger.debug(`Attempting to load power-ups...`);

        try {
            // Load existing power-up data
            const powerUpsData = (this.getPowerUpsDb().getData("/") || {}) as Record<string, SavedPowerUp>;
            const savedPowerUps = Object.values(powerUpsData);

            // Get all power-ups from Twitch
            const twitchPowerUps: CustomPowerUp[] = await TwitchApi.powerUps.getCustomPowerUps();
            if (twitchPowerUps == null) {
                this.logger.error("Twitch power-ups returned null!");
                this.powerUps = powerUpsData;
                return;
            }

            // Determine new power-ups (not previously saved)
            const newPowerUps: SavedPowerUp[] = twitchPowerUps
                .filter(np => savedPowerUps.every(p => p.id !== np.id))
                .map((np) => {
                    return {
                        id: np.id,
                        twitchData: np
                    };
                });

            // Sync existing power-up Twitch data, drop those that no longer exist on Twitch, then add new ones
            const syncedPowerUps: Record<string, SavedPowerUp> = savedPowerUps
                .map((p) => {
                    p.twitchData = twitchPowerUps.find(tp => tp.id === p.id);
                    return p;
                })
                .filter(p => p.twitchData != null)
                .concat(newPowerUps)
                .reduce((acc, current) => {
                    acc[current.id] = current;
                    return acc;
                }, {});

            this.getPowerUpsDb().push("/", syncedPowerUps);

            this.powerUps = syncedPowerUps;

            this.logger.debug(`Loaded power-ups.`);

            frontendCommunicator.send("power-ups:updated-all", Object.values(this.powerUps));
        } catch (err) {
            this.logger.warn(`There was an error reading power-ups file.`, err);
        }
    }

    async savePowerUp(powerUp: SavedPowerUp, emitUpdateEvent = false): Promise<SavedPowerUp> {
        if (powerUp == null || powerUp.id == null) {
            return null;
        }

        // Power-ups twitchData is read-only from Firebot; never write back to Twitch.
        // Preserve the latest twitchData from memory if available.
        const existing = this.powerUps[powerUp.id];
        if (existing != null) {
            powerUp.twitchData = existing.twitchData;
        }

        this.powerUps[powerUp.id] = powerUp;

        try {
            const db = this.getPowerUpsDb();

            db.push(`/${powerUp.id}`, powerUp);

            this.logger.debug(`Saved power-up ${powerUp.id} to file.`);

            if (emitUpdateEvent) {
                frontendCommunicator.send("power-ups:updated", powerUp);
            }

            return powerUp;
        } catch (err) {
            this.logger.warn(`There was an error saving a power-up.`, err);
            return null;
        }
    }

    async saveAllPowerUps(allPowerUps: SavedPowerUp[]): Promise<void> {
        const powerUpsObject: Record<string, SavedPowerUp> = allPowerUps.reduce((acc, current) => {
            acc[current.id] = current;
            return acc;
        }, {});

        this.powerUps = powerUpsObject;

        try {
            const db = this.getPowerUpsDb();

            db.push("/", this.powerUps);

            this.logger.debug(`Saved all power-ups to file.`);
        } catch (err) {
            this.logger.warn(`There was an error saving all power-ups.`, err);
        }
    }

    getPowerUp(powerUpId: string): SavedPowerUp {
        if (powerUpId == null) {
            return null;
        }
        return this.powerUps[powerUpId];
    }

    getPowerUpIdByName(powerUpName: string): string {
        if (powerUpName == null) {
            return null;
        }
        const powerUp = Object.values(this.powerUps)
            .filter(p => p.twitchData != null)
            .find(p => p.twitchData.title === powerUpName);

        return powerUp ? powerUp.id : null;
    }

    private async triggerPowerUpEffects(
        metadata: PowerUpRedemptionMetadata,
        effectList?: EffectList,
        manual = false
    ): Promise<void> {
        if (effectList == null || effectList.list == null) {
            return;
        }

        const processEffectsRequest = {
            trigger: {
                type: manual ? "manual" : "power_up",
                metadata: metadata
            } as Trigger,
            effects: effectList
        };

        try {
            await effectRunner.processEffects(processEffectsRequest);
        } catch (reason) {
            this.logger.error(`error when running effects: ${reason}`);
        }
    }

    async triggerPowerUp(
        powerUpId: string,
        metadata: PowerUpRedemptionMetadata,
        manual = false
    ): Promise<boolean | void> {
        const savedPowerUp = this.powerUps[powerUpId];
        if (metadata.username && metadata.userId && metadata.userDisplayName) {
            await ActiveUserHandler.addActiveUser(
                { userName: metadata.username, userId: metadata.userId, displayName: metadata.userDisplayName },
                true
            );
        }
        if (savedPowerUp == null || savedPowerUp.effects == null || savedPowerUp.effects.list == null) {
            return;
        }

        return this.triggerPowerUpEffects(metadata, savedPowerUp.effects, manual);
    }
}

const powerUpsManager = new PowerUpsManager();

export = powerUpsManager;
