import type { FirebotGame, GameDefinition, GameSettings } from "../../types/games";
import { ProfileManager } from "../common/profile-manager";
import frontendCommunicator from "../common/frontend-communicator";
import logger from "../logwrapper";

class GameManager {
    private _registeredGames: FirebotGame[] = [];
    private _allGamesSettings: Record<string, GameSettings> = {};

    constructor() {
        frontendCommunicator.on("games:get-games", () => {
            return this.getGames();
        });

        frontendCommunicator.on("games:update-game-settings", (data: {
            gameId: string;
            settingCategories: FirebotGame["settingCategories"];
            activeStatus: boolean;
        }) => {
            const { gameId, settingCategories, activeStatus } = data;

            this.updateGameSettings(gameId, settingCategories, activeStatus);
        });

        frontendCommunicator.on("games:reset-game-to-defaults", (gameId: string) => {
            const game = this._registeredGames.find(g => g.id === gameId);

            if (game == null) {
                return;
            }

            this.updateGameSettings(gameId, null, null);
        });
    }

    private getGameDb() {
        return ProfileManager.getJsonDbInProfile("/games");
    }

    loadGameSettings() {
        try {
            const savedGameSettings = this.getGameDb().getData("/") as Record<string, GameSettings>;
            if (savedGameSettings != null) {
                this._allGamesSettings = savedGameSettings;
            }
        } catch { }
    }

    /**
     * Register a Firebot game
     * @param game The game to register with the system
     */
    registerGame(game: FirebotGame) {
        if (game == null) {
            return;
        }

        if (this._registeredGames.some(g => g.id === game.id)) {
            return;
        }

        game.active = false;

        let gameSettings = this._allGamesSettings[game.id];
        if (gameSettings) {
            game.active = gameSettings.active;
        } else {
            gameSettings = { active: false };
        }

        if (gameSettings.active && game.onLoad) {
            game.onLoad(gameSettings);
        }

        this._registeredGames.push(game);

        logger.debug(`Registered game ${game.id}`);
    }

    /**
     * Gets the settings for a game
     * @param gameId - The ID of the game
     * @returns The game settings
     */
    getGameSettings(gameId: string): GameSettings {
        const game = this._registeredGames.find(g => g.id === gameId);
        if (!game) {
            return null;
        }
        return this.buildGameSettings(game, this._allGamesSettings[game.id]);
    }

    private getGames(): GameDefinition[] {
        return this._registeredGames.map((g) => {
            return {
                id: g.id,
                name: g.name,
                subtitle: g.subtitle,
                description: g.description,
                icon: g.icon,
                active: g.active,
                settingCategories: this.setGameSettingValues(
                    g.settingCategories,
                    this.buildGameSettings(g, this._allGamesSettings[g.id])
                )
            };
        });
    }

    private buildGameSettings(game: FirebotGame, savedSettings: GameSettings) {
        let settingsData: GameSettings = {
            active: game.active,
            settings: {}
        };

        if (savedSettings != null) {
            settingsData = savedSettings;
        }

        if (game.settingCategories) {
            for (const categoryId of Object.keys(game.settingCategories)) {
                if (settingsData.settings[categoryId] == null) {
                    settingsData.settings[categoryId] = {};
                }
                for (const settingId of Object.keys(game.settingCategories[categoryId].settings)) {
                    if (settingsData.settings[categoryId][settingId] === undefined) {
                        settingsData.settings[categoryId][settingId] = game.settingCategories[categoryId].settings[settingId].default;
                    }
                }
            }
        }
        return settingsData;
    }

    private setGameSettingValues(
        settingCategories: FirebotGame["settingCategories"],
        savedSettings: GameSettings
    ): FirebotGame["settingCategories"] {
        if (settingCategories && savedSettings) {
            for (const categoryId of Object.keys(settingCategories)) {
                for (const settingId of Object.keys(settingCategories[categoryId].settings)) {
                    if (savedSettings.settings[categoryId]) {
                        settingCategories[categoryId].settings[settingId].value = savedSettings.settings[categoryId][settingId];
                    }
                }
            }
        }

        return settingCategories;
    }

    private getGameSettingsFromValues(
        settingCategories: FirebotGame["settingCategories"],
        savedSettings: GameSettings
    ): GameSettings {
        if (settingCategories && savedSettings) {
            for (const categoryId of Object.keys(settingCategories)) {
                for (const settingId of Object.keys(settingCategories[categoryId].settings)) {
                    savedSettings.settings[categoryId][settingId] = settingCategories[categoryId].settings[settingId].value;
                }
            }
        }

        return savedSettings;
    }

    private updateGameSettings(
        gameId: string,
        settingCategories: FirebotGame["settingCategories"],
        activeStatus: boolean
    ) {
        const game = this._registeredGames.find(g => g.id === gameId);

        if (game == null) {
            return;
        }

        const previousSettings = this.buildGameSettings(game, this._allGamesSettings[game.id]);
        const previousActiveStatus = previousSettings.active;

        let gameSettings: GameSettings;
        if (settingCategories == null) {
            gameSettings = {
                active: false
            };

            game.active = false;

            delete this._allGamesSettings[game.id];
        } else {

            gameSettings = this.getGameSettingsFromValues(settingCategories, previousSettings);
            gameSettings.active = activeStatus;
            game.active = activeStatus;

            this._allGamesSettings[game.id] = gameSettings;
        }

        this.saveAllGameSettings();

        if (gameSettings.active) {
            //game has been enabled, load it
            if (previousActiveStatus === false && game.onLoad) {
                game.onLoad(gameSettings);
            } else if (game.onSettingsUpdate) {
                // just trigger settings update
                game.onSettingsUpdate(gameSettings);
            }
        } else {
            //game has been disabled, unload it
            if (previousActiveStatus === true && game.onUnload) {
                game.onUnload(gameSettings);
            }
        }

        frontendCommunicator.send("games:game-settings-updated", this.getGames());
    }

    private saveAllGameSettings() {
        try {
            this.getGameDb().push("/", this._allGamesSettings);
        } catch { }
    }
}

const manager = new GameManager();

export { manager as GameManager };