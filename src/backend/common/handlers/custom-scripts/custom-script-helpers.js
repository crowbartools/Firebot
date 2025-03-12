"use strict";
const twitchChat = require("../../../chat/twitch-chat");
const twitchApi = require("../../../twitch-api/api");
const profileManager = require("../../profile-manager");
const settings = require('../../settings-manager').SettingsManager;
const path = require("path");
const logger = require("../../../logwrapper");
const {
    app
} = require('electron');

const accountAccess = require('../../account-access');

function buildModules(scriptManifest) {
    const streamerName = accountAccess.getAccounts().streamer.username || "Unknown Streamer";
    const appVersion = app.getVersion();

    const request = require("request");

    const customRequest = request.defaults({
        headers: {
            'User-Agent': `Firebot/${appVersion};CustomScript/${scriptManifest.name}/${scriptManifest.version};User/${streamerName}`
        }
    });

    // safe guard: enforce our user-agent
    customRequest.init = function init(options) {
        if (options != null && options.headers != null) {
            delete options.headers['User-Agent'];
        }
        customRequest.prototype.init.call(this, options);
    };

    const notificationManager = require("../../../notifications/notification-manager").default;

    return {
        request: customRequest,
        spawn: require('child_process').spawn,
        childProcess: require('child_process'),
        fs: require('fs-extra'),
        path: require('path'),
        JsonDb: require('node-json-db').JsonDB,
        moment: require('moment'),
        logger: logger,
        // thin chat shim for basic backwards compatibility
        chat: {
            smartSend: async (...args) => {
                await twitchChat.sendChatMessage(...args);
            },
            deleteChat: async (id) => {
                await twitchApi.chat.deleteChatMessage(id);
            }
        },
        twitchChat: twitchChat,
        twitchApi: twitchApi,
        httpServer: require("../../../../server/http-server-manager"),
        effectManager: require("../../../effects/effectManager"),
        effectRunner: require("../../effect-runner"),
        conditionManager: require("../../../effects/builtin/conditional-effects/conditions/condition-manager"),
        restrictionManager: require("../../../restrictions/restriction-manager"),
        commandManager: require("../../../chat/commands/command-manager"),
        eventManager: require("../../../events/EventManager"),
        eventFilterManager: require("../../../events/filters/filter-manager"),
        eventFilterFactory: require("../../../events/filters/filter-factory"),
        replaceVariableManager: require("../../../variables/replace-variable-manager"),
        replaceVariableFactory: require("../../../variables/variable-factory"),
        integrationManager: require("../../../integrations/integration-manager"),
        customVariableManager: require("../../../common/custom-variable-manager"),
        customRolesManager: require("../../../roles/custom-roles-manager"),
        firebotRolesManager: require("../../../roles/firebot-roles-manager"),
        timerManager: require("../../../timers/timer-manager"),
        gameManager: require("../../../games/game-manager"),

        /** @deprecated Use `currencyAccess`, `currencyManagerNew`, and `currencyCommandManager` instead */
        currencyDb: require("../../../database/currencyDatabase"),
        /** @deprecated Use `currencyAccess`, `currencyManagerNew`, and `currencyCommandManager` instead */
        currencyManager: require("../../../currency/currencyManager"),

        currencyAccess: require("../../../currency/currency-access").default,
        currencyManagerNew: require("../../../currency/currency-manager"),
        currencyCommandManager: require("../../../currency/currency-command-manager"),

        /** @deprecated Use `viewerDatabase`, `viewerMetadataManager`, and `viewerOnlineStatusManager` instead */
        userDb: require("../../../database/userDatabase"),
        viewerDatabase: require("../../../viewers/viewer-database"),
        viewerMetadataManager: require("../../../viewers/viewer-metadata-manager"),
        viewerOnlineStatusManager: require("../../../viewers/viewer-online-status-manager"),

        quotesManager: require("../../../quotes/quotes-manager"),
        frontendCommunicator: require("../../frontend-communicator"),
        counterManager: require("../../../counters/counter-manager").CounterManager,
        utils: require("../../../utility"),
        resourceTokenManager: require("../../../resource-token-manager").ResourceTokenManager,

        notificationManager: {
            addNotification: (notificationBase, permanentlySave = true) => {
                return notificationManager.addNotification({
                    ...notificationBase,
                    source: "script",
                    scriptName: scriptManifest.name ?? "unknown"
                }, permanentlySave);
            },
            getNotification: (id) => {
                const notification = notificationManager.getNotification(id);
                if (notification && notification.source === "script" && notification.scriptName === (scriptManifest.name ?? "unknown")) {
                    return notification;
                }
                return null;
            },
            getNotifications: () => {
                return notificationManager.getNotifications()
                    .filter(n => n.source === "script" && n.scriptName === (scriptManifest.name ?? "unknown"));
            },
            deleteNotification: (id) => {
                const notification = notificationManager.getNotification(id);
                if (notification && notification.source === "script" && notification.scriptName === (scriptManifest.name ?? "unknown")) {
                    notificationManager.deleteNotification(id);
                }
            },
            clearAllNotifications: () => {
                notificationManager.getNotifications()
                    .filter(n => n.source === "script" && n.scriptName === (scriptManifest.name ?? "unknown"))
                    .forEach(n => notificationManager.deleteNotification(n.id));
            }
        },
        uiExtensionManager: require("../../../ui-extensions/ui-extension-manager")
    };
}


function buildRunRequest(scriptManifest, params, trigger) {
    return {
        modules: buildModules(scriptManifest),
        command: trigger?.metadata?.userCommand,
        user: {
            name: trigger?.metadata?.username
        },
        firebot: {
            accounts: accountAccess.getAccounts(),
            settings: settings,
            version: app.getVersion()
        },
        parameters: params,
        trigger: trigger
    };
}

function getScriptPath(scriptName) {
    const scriptsFolder = profileManager.getPathInProfile("/scripts");
    return path.resolve(scriptsFolder, scriptName);
}

function mapParameters(parameterData) {
    //simplify parameters
    const simpleParams = {};
    if (parameterData != null) {
        Object.keys(parameterData).forEach((k) => {
            const param = parameterData[k];
            if (param != null) {
                simpleParams[k] = param.value == null && param.value !== ""
                    ? param.default
                    : param.value;
            }
        });
    }
    return simpleParams;
}

exports.mapParameters = mapParameters;
exports.getScriptPath = getScriptPath;
exports.buildRunRequest = buildRunRequest;