"use strict";

const { app } = require("electron");
const EventEmitter = require("events");
const path = require("path");

const { TwitchApi } = require("../../../streaming-platforms/twitch/api");
const { ProfileManager } = require("../../profile-manager");
const { SettingsManager } = require("../../settings-manager");
const webhookManager = require("../../../webhooks/webhook-config-manager");
const twitchChat = require("../../../chat/twitch-chat");
const logger = require("../../../logwrapper");
const utils = require("../../../utils");

/**
 * Shim around the webhook manager to filter webhooks by script name and re-emit events
 * specific to this script.
 * @class
 * @extends EventEmitter
 */
class ScriptWebhookManager extends EventEmitter {
    constructor(scriptName) {
        super();
        this.scriptName = scriptName;
        this.setMaxListeners(0);

        webhookManager.on("webhook-received", (data) => {
            if (data.config.scriptId !== this.scriptName) {
                return;
            }
            this.emit("webhook-received", data);
        });
    }

    saveWebhook(name) {
        if (name == null || name.trim() === "") {
            return null;
        }

        const existing = webhookManager
            .getAllItems()
            .find(w => w.name === name && w.scriptId === this.scriptName);

        return webhookManager.saveItem({
            name,
            id: existing?.id ?? undefined,
            scriptId: this.scriptName
        });
    }

    getWebhook(name) {
        if (name == null || name.trim() === "") {
            return null;
        }

        return webhookManager
            .getAllItems()
            .find(w => w.name === name && w.scriptId === this.scriptName)
            ?? null;
    }

    deleteWebhook(name) {
        if (name == null || name.trim() === "") {
            return false;
        }

        const existing = webhookManager
            .getAllItems()
            .find(w => w.name === name && w.scriptId === this.scriptName);

        if (existing == null) {
            return false;
        }

        return webhookManager.deleteItem(existing.id);
    }

    getWebhooks() {
        return webhookManager
            .getAllItems()
            .filter(w => w.scriptId === this.scriptName);
    }

    getWebhookUrl(name) {
        const webhook = this.getWebhook(name);

        if (webhook == null) {
            return null;
        }

        return webhookManager.getWebhookUrlById(webhook.id);
    }
}

const { AccountAccess } = require("../../account-access");

function buildModules(scriptManifest) {
    const notificationManager = require("../../../notifications/notification-manager").NotificationManager;

    const scriptNameNormalized = scriptManifest.name.replace(/[#%&{}\\<>*?/$!'":@`|=\s-]+/g, "-").toLowerCase();

    return {
        spawn: require("child_process").spawn,
        childProcess: require("child_process"),
        fs: require("fs-extra"),
        path: require("path"),
        JsonDb: require("node-json-db").JsonDB,
        moment: require("moment"),
        logger: logger,
        // thin chat shim for basic backwards compatibility
        chat: {
            /**
             * @deprecated Use `twitchApi.chat.sendChatMessage` instead.
             */
            smartSend: async (...args) => {
                await twitchChat.sendChatMessage(...args);
            },
            deleteChat: async (id) => {
                await TwitchApi.chat.deleteChatMessage(id);
            }
        },
        /**
         * @deprecated Use the `twitchApi.chat` class instead.
         */
        twitchChat: twitchChat,
        twitchApi: TwitchApi,
        httpServer: require("../../../../server/http-server-manager"),
        effectManager: require("../../../effects/effect-manager").EffectManager,
        effectRunner: require("../../effect-runner"),
        conditionManager: require("../../../effects/builtin/conditional-effects/conditions/condition-manager"),
        restrictionManager: require("../../../restrictions/restriction-manager").RestrictionsManager,
        commandManager: require("../../../chat/commands/command-manager").CommandManager,
        eventManager: require("../../../events/event-manager").EventManager,
        eventFilterManager: require("../../../events/filters/filter-manager").FilterManager,
        eventFilterFactory: require("../../../events/filters/filter-factory"),
        replaceVariableManager: require("../../../variables/replace-variable-manager").ReplaceVariableManager,
        replaceVariableFactory: require("../../../variables/variable-factory"),
        integrationManager: require("../../../integrations/integration-manager"),
        customVariableManager: require("../../../common/custom-variable-manager").CustomVariableManager,
        customRolesManager: require("../../../roles/custom-roles-manager"),
        firebotRolesManager: require("../../../roles/firebot-roles-manager"),
        timerManager: require("../../../timers/timer-manager").TimerManager,
        gameManager: require("../../../games/game-manager").GameManager,

        overlayWidgetsManager: require("../../../overlay-widgets/overlay-widgets-manager"),
        overlayWidgetConfigManager: require("../../../overlay-widgets/overlay-widget-config-manager"),

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

        quotesManager: require("../../../quotes/quote-manager").QuoteManager,
        frontendCommunicator: require("../../frontend-communicator"),
        counterManager: require("../../../counters/counter-manager").CounterManager,
        utils: {
            ...utils,
            // These are for back-compat
            secondsForHumans: secs => utils.humanizeTime(secs),
            getUptime: async () => await TwitchApi.streams.getStreamUptime(),
            formattedSeconds: (secs, simpleOutput = false) =>
                utils.humanizeTime(secs, simpleOutput === true ? "simple" : "default")
        },
        resourceTokenManager: require("../../../resource-token-manager").ResourceTokenManager,
        webhookManager: new ScriptWebhookManager(scriptNameNormalized),
        notificationManager: {
            addNotification: (notificationBase, permanentlySave = true) => {
                return notificationManager.addNotification(
                    {
                        ...notificationBase,
                        source: "script",
                        scriptName: scriptManifest.name ?? "unknown"
                    },
                    permanentlySave
                );
            },
            getNotification: (id) => {
                const notification = notificationManager.getNotification(id);
                if (
                    notification &&
                    notification.source === "script" &&
                    notification.scriptName === (scriptManifest.name ?? "unknown")
                ) {
                    return notification;
                }
                return null;
            },
            getNotifications: () => {
                return notificationManager
                    .getNotifications()
                    .filter(n => n.source === "script" && n.scriptName === (scriptManifest.name ?? "unknown"));
            },
            deleteNotification: (id) => {
                const notification = notificationManager.getNotification(id);
                if (
                    notification &&
                    notification.source === "script" &&
                    notification.scriptName === (scriptManifest.name ?? "unknown")
                ) {
                    notificationManager.deleteNotification(id);
                }
            },
            clearAllNotifications: () => {
                notificationManager
                    .getNotifications()
                    .filter(n => n.source === "script" && n.scriptName === (scriptManifest.name ?? "unknown"))
                    .forEach(n => notificationManager.deleteNotification(n.id));
            }
        },
        uiExtensionManager: require("../../../ui-extensions/ui-extension-manager")
    };
}

function buildRunRequest(scriptManifest, params, trigger) {
    const scriptNameNormalized = scriptManifest.name.replace(/[#%&{}\\<>*?/$!'":@`|=\s-]+/g, "-").toLowerCase();
    const scriptDataDir = path.resolve(ProfileManager.getPathInProfile("/script-data/"), `./${scriptNameNormalized}/`);

    return {
        modules: buildModules(scriptManifest),
        command: trigger?.metadata?.userCommand,
        user: {
            name: trigger?.metadata?.username
        },
        firebot: {
            accounts: AccountAccess.getAccounts(),
            settings: SettingsManager,
            version: app.getVersion()
        },
        parameters: params,
        trigger: trigger,
        scriptDataDir
    };
}

function getScriptPath(scriptName) {
    const scriptsFolder = ProfileManager.getPathInProfile("/scripts");
    return path.resolve(scriptsFolder, scriptName);
}

function mapParameters(parameterData) {
    //simplify parameters
    const simpleParams = {};
    if (parameterData != null) {
        Object.keys(parameterData).forEach((k) => {
            const param = parameterData[k];
            if (param != null) {
                simpleParams[k] = param.value == null && param.value !== "" ? param.default : param.value;
            }
        });
    }
    return simpleParams;
}

exports.getScriptPath = getScriptPath;
exports.buildRunRequest = buildRunRequest;
exports.mapParameters = mapParameters;
