"use strict";

(function() {

    angular
        .module("firebotApp")
        .component("pluginSettings", {
            template: `
                <div>

                    <div
                        style="display:flex; align-items:stretch; border-radius: 8px; overflow: hidden; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); margin-bottom: 8px;"
                    >
                        <div
                            ng-style="{ background: isScriptingEnabled() ? '#48a14d' : '#d99211' }"
                            style="width: 5px; flex-shrink: 0;"
                        ></div>
                        <div style="display:flex; align-items:center; padding: 16px 20px; gap: 16px; flex-grow: 1; min-width: 0;">
                            <div
                                ng-style="{ background: isScriptingEnabled() ? 'rgba(72,161,77,0.18)' : 'rgba(217,146,17,0.18)', color: isScriptingEnabled() ? '#48a14d' : '#d99211' }"
                                style="width: 44px; height: 44px; border-radius: 50%; display:flex; align-items:center; justify-content:center; flex-shrink: 0;"
                            >
                                <i
                                    ng-class="isScriptingEnabled() ? 'fas fa-check' : 'fas fa-times'"
                                    style="font-size: 20px;"
                                ></i>
                            </div>
                            <div style="flex-grow: 1; min-width: 0;">
                                <div style="font-weight: 600; font-size: 15px;" ng-if="isScriptingEnabled()">
                                    Plugins &amp; Scripts are enabled
                                </div>
                                <div style="font-weight: 600; font-size: 15px;" ng-if="!isScriptingEnabled()">
                                    Plugins &amp; Scripts are disabled
                                </div>
                                <div class="muted" style="font-size: 13px; margin-top: 2px;" ng-if="isScriptingEnabled()">
                                    Firebot will load installed plugins on startup and allow the Run Custom Script effect to execute.
                                </div>
                                <div class="muted" style="font-size: 13px; margin-top: 2px;" ng-if="!isScriptingEnabled()">
                                    Installed plugins won't load and the Run Custom Script effect will be skipped. Only enable this if you trust the scripts you install.
                                </div>
                            </div>
                            <div style="flex-shrink: 0;">
                                <firebot-button
                                    ng-if="isScriptingEnabled()"
                                    text="Disable"
                                    type="default"
                                    ng-click="setScriptingEnabled(false)"
                                />
                                <firebot-button
                                    ng-if="!isScriptingEnabled()"
                                    text="Enable"
                                    type="default"
                                    ng-click="setScriptingEnabled(true)"
                                />
                            </div>
                        </div>
                    </div>
                    <div class="muted" style="font-size: 12px; padding: 0 4px 20px;">
                        Want to write your own plugins? Learn how <a
                            class="clickable"
                            ng-click="openLink('https://docs.firebot.app/v5/dev/scripts')"
                        >here</a>.
                    </div>

                    <div>
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 10px;">
                            <div>
                                <h3 style="margin: 0;">Plugins</h3>
                                <div class="muted" style="font-size: 13px;">Plugins are scripts loaded at startup that can register new effects, variables, events, and more.</div>
                            </div>
                            <div>
                                <firebot-button
                                    text="Install Plugin"
                                    type="primary"
                                    icon="fa-plus"
                                    ng-click="installPlugin()"
                                    disabled="!settings.getSetting('RunCustomScripts')"
                                />
                            </div>
                        </div>

                        <div ng-if="getPlugins().length === 0" class="muted" style="padding: 30px 20px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px; text-align:center;">
                            No plugins installed. Click <b>Install Plugin</b> to add one.
                        </div>

                        <div ng-if="getPlugins().length > 0" style="display: flex; flex-direction: column; gap: 10px;">
                            <div
                                ng-repeat="plugin in getPlugins() | orderBy:getPluginName track by plugin.config.id"
                                style="display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; min-width: 0;"
                            >
                                <plugin-icon plugin-icon="plugin.details.manifest.icon"></plugin-icon>

                                <div style="flex-grow: 1; min-width: 0;">
                                    <div style="display:flex; align-items:baseline; gap: 8px; flex-wrap: wrap;">
                                        <span style="font-weight: 600; font-size: 15px; word-break: break-word;">
                                            {{getPluginName(plugin)}}
                                        </span>
                                        <span
                                            class="muted"
                                            style="font-size: 11px; padding: 1px 6px; border-radius: 4px; background: rgba(255,255,255,0.06);"
                                            ng-if="plugin.details.manifest.version"
                                        >v{{plugin.details.manifest.version}}</span>
                                        <span
                                            class="muted"
                                            style="font-size: 12px;"
                                            ng-if="plugin.details.manifest.author"
                                        >by {{plugin.details.manifest.author}}</span>
                                        <span
                                            ng-if="plugin.config.enabled === false"
                                            style="font-size: 11px; padding: 1px 8px; border-radius: 10px; background: rgba(217,146,17,0.18); color: #d99211;"
                                        >Disabled</span>
                                    </div>
                                    <div
                                        class="muted"
                                        style="font-size: 13px; margin-top: 4px; line-height: 1.4; overflow-wrap: anywhere;"
                                        ng-if="plugin.details.manifest.description"
                                    >
                                        {{plugin.details.manifest.description}}
                                    </div>
                                    <div
                                        ng-if="hasPluginLinks(plugin)"
                                        style="display:flex; align-items:center; flex-wrap: wrap; gap: 8px; margin-top: 8px;"
                                    >
                                        <a
                                            ng-if="plugin.details.manifest.repo"
                                            class="clickable plugin-link-pill"
                                            ng-click="openLink(plugin.details.manifest.repo)"
                                            uib-tooltip="{{plugin.details.manifest.repo}}"
                                            tooltip-append-to-body="true"
                                        >
                                            <i class="fab fa-github"></i> Source
                                        </a>
                                        <a
                                            ng-if="plugin.details.manifest.website"
                                            class="clickable plugin-link-pill"
                                            ng-click="openLink(plugin.details.manifest.website)"
                                            uib-tooltip="{{plugin.details.manifest.website}}"
                                            tooltip-append-to-body="true"
                                        >
                                            <i class="fas fa-globe"></i> Website
                                        </a>
                                        <a
                                            ng-if="plugin.details.manifest.support"
                                            class="clickable plugin-link-pill"
                                            ng-click="openLink(plugin.details.manifest.support)"
                                            uib-tooltip="{{plugin.details.manifest.support}}"
                                            tooltip-append-to-body="true"
                                        >
                                            <i class="fas fa-life-ring"></i> Support
                                        </a>
                                    </div>
                                </div>

                                <div style="display:flex; align-items:center; gap: 6px; flex-shrink: 0;">
                                    <firebot-button
                                        text="Configure"
                                        type="default"
                                        size="small"
                                        ng-click="configurePlugin(plugin)"
                                    />
                                    <button
                                        aria-label="Open Plugin Menu"
                                        class="noselect clickable plugin-card-menu-btn"
                                        context-menu="pluginMenuOptions(plugin)"
                                        context-menu-on="click"
                                        context-menu-class="angular-context-menu"
                                        context-menu-orientation="left"
                                        uib-tooltip="More options"
                                        tooltip-append-to-body="true"
                                        style="background: transparent; border: none; padding: 4px 10px; font-size: 18px; line-height: 1;"
                                    >
                                        <i class="fal fa-ellipsis-v"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
          `,
            controller: function($rootScope, $scope, settingsService, utilityService,
                pluginsService, backendCommunicator, ngToast, $q, profileManager) {
                $scope.openLink = $rootScope.openLinkExternally;
                $scope.settings = settingsService;

                pluginsService.loadPlugins();

                $scope.getPluginName = (plugin) => {
                    return plugin.details.manifest.name || plugin.config.fileName;
                };

                $scope.isScriptingEnabled = function() {
                    return !!settingsService.getSetting('RunCustomScripts');
                };

                $scope.setScriptingEnabled = function(enabled) {
                    settingsService.saveSetting('RunCustomScripts', !!enabled);
                };

                $scope.getPlugins = function() {
                    return pluginsService.getInstalledPlugins();
                };

                $scope.hasPluginLinks = function(plugin) {
                    const manifest = (plugin && plugin.details && plugin.details.manifest) || {};
                    return !!(manifest.repo || manifest.website || manifest.support);
                };

                $scope.togglePluginEnabled = function(plugin) {
                    const next = !(plugin.config.enabled !== false);
                    plugin.config.enabled = next;
                    pluginsService.setPluginEnabled(plugin.config.id, next);
                };

                $scope.configurePlugin = function(plugin) {
                    utilityService.showModal({
                        component: "configurePluginModal",
                        size: "md",
                        backdrop: true,
                        keyboard: true,
                        resolveObj: {
                            plugin: () => angular.copy(plugin),
                            isNewInstall: () => false
                        },
                        closeCallback: () => pluginsService.loadPlugins()
                    });
                };

                $scope.removePlugin = function(plugin) {
                    utilityService.showModal({
                        component: "removePluginModal",
                        size: "sm",
                        backdrop: true,
                        keyboard: true,
                        resolveObj: {
                            pluginName: () => plugin.details.manifest.name || plugin.config.fileName
                        },
                        closeCallback: (response) => {
                            if (response && response.confirmed) {
                                pluginsService.deletePlugin(plugin.config.id, response.deletePluginFile);
                            }
                        }
                    });
                };

                $scope.pluginMenuOptions = function(plugin) {
                    const isEnabled = plugin.config.enabled !== false;
                    return [
                        {
                            html: `<a href><i class="far ${isEnabled ? 'fa-toggle-off' : 'fa-toggle-on'}" style="margin-right: 10px;"></i> ${isEnabled ? 'Disable' : 'Enable'}</a>`,
                            click: () => {
                                $scope.togglePluginEnabled(plugin);
                            }
                        },
                        {
                            html: `<a href><i class="far fa-sync" style="margin-right: 10px;"></i> Update</a>`,
                            click: () => {
                                $scope.updatePlugin(plugin);
                            }
                        },
                        {
                            html: `<a href style="color: #d9534f;"><i class="far fa-trash" style="margin-right: 10px;"></i> Remove</a>`,
                            click: () => {
                                $scope.removePlugin(plugin);
                            }
                        }
                    ];
                };

                function openConfigureModalForInstall(details, fileName) {
                    const { randomUUID } = require("crypto");
                    const skeleton = {
                        config: {
                            id: randomUUID(),
                            fileName: fileName,
                            enabled: true,
                            parameters: {}
                        },
                        details: details
                    };

                    utilityService.showModal({
                        component: "configurePluginModal",
                        size: "md",
                        backdrop: "static",
                        keyboard: false,
                        resolveObj: {
                            plugin: () => skeleton,
                            isNewInstall: () => true
                        },
                        closeCallback: (result) => {
                            if (!result || !result.saved) {
                                // user cancelled - clean up the copied file
                                pluginsService.cancelInstall(fileName);
                            }
                            pluginsService.loadPlugins();
                        }
                    });
                }

                function doInstall(filePath, overwrite) {
                    return $q.when(pluginsService.installPluginFromFile(filePath, overwrite))
                        .then((result) => {
                            if (!result) {
                                ngToast.create("Plugin install failed.");
                                return;
                            }
                            if (result.conflict) {
                                utilityService.showConfirmationModal({
                                    title: "Plugin File Already Exists",
                                    question: `${result.error} Overwrite it?`,
                                    confirmLabel: "Overwrite",
                                    confirmBtnType: "btn-warning"
                                }).then((confirmed) => {
                                    if (confirmed) {
                                        doInstall(filePath, true);
                                    }
                                });
                                return;
                            }
                            if (result.success === false) {
                                utilityService.showErrorModal(result.error || "Failed to install plugin.");
                                return;
                            }
                            openConfigureModalForInstall(result.details, result.fileName);
                        });
                }

                $scope.installPlugin = function() {
                    $q.when(backendCommunicator.fireEventAsync("open-file-browser", {
                        currentPath: profileManager.getPathInProfile("/scripts"),
                        options: {
                            title: "Select Plugin",
                            buttonLabel: "Select",
                            filters: [{ name: "JavaScript", extensions: ["js"] }]
                        }
                    })).then((response) => {
                        if (!response || !response.path) {
                            return;
                        }
                        doInstall(response.path, false);
                    });
                };

                function doUpdate(plugin, filePath, overwrite) {
                    return $q.when(pluginsService.updatePluginFromFile(plugin.config.id, filePath, overwrite))
                        .then((result) => {
                            if (!result) {
                                ngToast.create("Plugin update failed.");
                                return;
                            }
                            if (result.conflict) {
                                utilityService.showConfirmationModal({
                                    title: "Plugin File Already Exists",
                                    question: `${result.error} Overwrite it?`,
                                    confirmLabel: "Overwrite",
                                    confirmBtnType: "btn-warning"
                                }).then((confirmed) => {
                                    if (confirmed) {
                                        doUpdate(plugin, filePath, true);
                                    }
                                });
                                return;
                            }
                            if (result.success === false) {
                                utilityService.showErrorModal(result.error || "Failed to update plugin.");
                                return;
                            }
                            pluginsService.loadPlugins();
                            ngToast.create({
                                className: "success",
                                content: `Plugin '${plugin.details && plugin.details.name ? plugin.details.name : plugin.config.fileName}' updated.`
                            });
                        });
                }

                $scope.updatePlugin = function(plugin) {
                    if (!plugin || !plugin.config) {
                        return;
                    }
                    $q.when(backendCommunicator.fireEventAsync("open-file-browser", {
                        currentPath: profileManager.getPathInProfile("/scripts"),
                        options: {
                            title: "Select New Plugin",
                            buttonLabel: "Select",
                            filters: [{ name: "JavaScript", extensions: ["js"] }]
                        }
                    })).then((response) => {
                        if (!response || !response.path) {
                            return;
                        }
                        doUpdate(plugin, response.path, false);
                    });
                };
            }
        });
}());
