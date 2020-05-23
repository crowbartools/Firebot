"use strict";

const profileManager = require("../common/profile-manager");
const frontendCommunicator = require("../common/frontend-communicator");

let getGameDb = () => profileManager.getJsonDbInProfile("/games");

let allGamesSettings = {};

const registeredGames = [];

function registerGame(game) {
    if (game == null) return;

    if (registeredGames.some(g => g.id === game.id)) return;

    game.active = false;

    let gameSettings = allGamesSettings[game.id];
    if (gameSettings) {
        game.active = gameSettings.active;
    }

    if (game.onLoad) {
        game.onLoad(gameSettings);
    }

    if (game.active && game.initializeTrigger === 'immediate' && game.onInitialize) {
        game.onInitialize(gameSettings);
    }

    registeredGames.push(game);
}

function buildGameSettings(game) {
    let settingsData = {
        active: game.active,
        settings: {}
    };

    let savedSettings = allGamesSettings[game.id];
    if (savedSettings) {
        settingsData = savedSettings;
    }

    if (game.settingCategories) {
        for (let categoryId of Object.keys(game.settingCategories)) {
            if (settingsData.settings[categoryId] == null) {
                settingsData.settings[categoryId] = {};
            }
            for (let settingId of Object.keys(game.settingCategories[categoryId].settings)) {
                if (settingsData.settings[categoryId][settingId] === undefined) {
                    settingsData.settings[categoryId][settingId] = game.settingCategories[categoryId].settings[settingId].default;
                }
            }
        }
    }
    return settingsData;
}

function setGameSettingValues(settingCategories, savedSettings) {
    if (settingCategories && savedSettings) {
        for (let categoryId of Object.keys(settingCategories)) {
            for (let settingId of Object.keys(settingCategories[categoryId].settings)) {
                if (savedSettings.settings[categoryId]) {
                    settingCategories[categoryId].settings[settingId].value = savedSettings.settings[categoryId][settingId];
                }
            }
        }
    }
    return settingCategories;
}

function getGameSettingsFromValues(settingCategories, savedSettings) {
    if (settingCategories && savedSettings) {
        for (let categoryId of Object.keys(settingCategories)) {
            for (let settingId of Object.keys(settingCategories[categoryId].settings)) {
                savedSettings.settings[categoryId][settingId] = settingCategories[categoryId].settings[settingId].value;
            }
        }
    }
    return savedSettings;
}

function getGameSettings(gameId) {
    const game = registeredGames[gameId];
    if (!game) return null;
    return buildGameSettings(game);
}

function loadGameSettings() {
    try {
        let savedGameSettings = getGameDb().getData("/");
        if (savedGameSettings != null) {
            allGamesSettings = savedGameSettings;
        }
    } catch (error) {
        //
    }
}

function saveAllGameSettings() {
    try {
        getGameDb().push("/", allGamesSettings);
    } catch (error) {
        //
    }
}

frontendCommunicator.onAsync('get-games', () =>
    registeredGames.map(g => {
        return {
            id: g.id,
            name: g.name,
            description: g.description,
            icon: g.icon,
            settingCategories: setGameSettingValues(g.settingCategories, buildGameSettings(g))
        };
    }));

frontendCommunicator.on('game-settings-update', (data) => {
    const { gameId, settingCategories, activeStatus } = data;

    const game = registeredGames[gameId];

    if (game == null) return;

    let previousSettings = buildGameSettings(game);
    let previousActiveStatus = previousSettings.active;

    let gameSettings = getGameSettingsFromValues(settingCategories, previousSettings);
    gameSettings.active = activeStatus;

    allGamesSettings[game.id] = gameSettings;

    saveAllGameSettings();

    if (gameSettings.active) {
        if (game.onSettingsUpdate) {
            game.onSettingsUpdate(gameSettings);
        }

        if (!previousActiveStatus) {
            if (game.initializeTrigger === 'immediate' && game.onInitialize) {
                game.onInitialize(gameSettings);
            }
        }
    } else {
        if (previousActiveStatus && game.onTerminate) {
            game.onTerminate(gameSettings);
        }
    }

});

exports.loadGameSettings = loadGameSettings;
exports.registerGame = registerGame;
exports.getGameSettings = getGameSettings;