"use strict";

(function() {
    const { DateTime } = require("luxon");

    angular
        .module("firebotApp")
        .component("installCommunityPluginModal", {
            template: `
                <div class="sticky-element">
                    <div class="modal-header" style="border-bottom: 2px solid rgb(128 128 128 / 0.33);">
                        <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                        <h4 class="modal-title">Community Plugins</h4>
                    </div>
                    <div class="mx-8 mt-8">
                        <searchbar
                            search-id="searchQuery"
                            query="$ctrl.searchQuery"
                            placeholder-text="Search for community-made plugins"
                            debounce="500"
                        />
                    </div>
                </div>
                <div class="modal-body">
                    <div
                        ng-if="$ctrl.searchPerformed !== true && $ctrl.isSearching !== true"
                        class="flex flex-column items-center justify-center gap-4 p-4 my-20 h-full"
                    >
                        <i class="fal fa-search text-7xl"></i>
                        <h2 class="text-5xl m-0 font-black">Search for Plugins</h2>
                        <p class="text-center px-32">Looking for Firebot plugins? Just type your search into the box above!</p>
                    </div>
                    <div
                        ng-if="$ctrl.isSearching === true"
                        class="flex flex-column items-center justify-center gap-4 p-4 my-20 h-full"
                    >
                        <div class="loader"></div>
                        <h2 class="text-5xl m-0 font-black">Searching</h2>
                        <p class="text-center px-32">Hang tight! We're checking the warehouse for really cool Firebot plugins...</p>
                    </div>
                    <div
                        ng-if="$ctrl.searchPerformed === true && $ctrl.isSearching !== true && $ctrl.searchResults.length === 0"
                        class="flex flex-column items-center justify-center gap-4 p-4 my-20 h-full"
                    >
                        <i class="fal fa-exclamation text-7xl"></i>
                        <h2 class="text-5xl m-0 font-black">No Results Found</h2>
                        <p class="text-center px-32">Well this is embarassing. It doesn't look like we can find any plugins that match your search.</p>
                        <p class="text-center px-32">But don't worry! There are still plenty of great Firebot plugins out there. Check out our <a href="https://discord.gg/crowbartools-372817064034959370">Discord</a> to see all the cool stuff our community has made.</p>
                    </div>
                    <div
                        ng-if="$ctrl.searchPerformed === true && $ctrl.isSearching !== true && $ctrl.searchResults.length > 0"
                        class="flex flex-column gap-4 m-8"
                    >
                        <h2 class="text-4xl m-0 font-black">Search Results</h2>
                        <div
                            ng-repeat="plugin in $ctrl.searchResults track by $index"
                            style="display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; min-width: 0;"
                        >
                            <plugin-icon plugin-icon="plugin.manifest.icon"></plugin-icon>

                            <div style="flex-grow: 1; min-width: 0;">
                                <div style="display:flex; align-items:baseline; gap: 8px; flex-wrap: wrap;">
                                    <span style="font-weight: 600; font-size: 15px; word-break: break-word;">
                                        {{plugin.manifest.name}}
                                    </span>
                                    <span
                                        class="muted"
                                        style="font-size: 11px; padding: 1px 6px; border-radius: 4px; background: rgba(255,255,255,0.06);"
                                    >v{{plugin.manifest.version}}</span>
                                    <span
                                        class="muted"
                                        style="font-size: 12px;"
                                    >by {{plugin.manifest.author}}</span>
                                </div>
                                <div
                                    class="muted"
                                    style="font-size: 13px; margin-top: 4px; line-height: 1.4; overflow-wrap: anywhere;"
                                >
                                    {{plugin.manifest.description}}
                                </div>
                                <div
                                    class="muted"
                                    style="font-size: 13px; margin-top: 4px; line-height: 1.4; overflow-wrap: anywhere;"
                                >
                                    Last updated: {{$ctrl.getPluginReleaseDate(plugin)}}
                                </div>
                                <div
                                    ng-if="$ctrl.hasPluginLinks(plugin)"
                                    style="display:flex; align-items:center; flex-wrap: wrap; gap: 8px; margin-top: 8px;"
                                >
                                    <a
                                        ng-if="plugin.manifest.repo"
                                        class="clickable plugin-link-pill"
                                        ng-click="$ctrl.openLink(plugin.manifest.repo)"
                                        uib-tooltip="{{plugin.manifest.repo}}"
                                        tooltip-append-to-body="true"
                                    >
                                        <i class="fab fa-github"></i> Source
                                    </a>
                                    <a
                                        ng-if="plugin.manifest.website"
                                        class="clickable plugin-link-pill"
                                        ng-click="$ctrl.openLink(plugin.manifest.website)"
                                        uib-tooltip="{{plugin.manifest.website}}"
                                        tooltip-append-to-body="true"
                                    >
                                        <i class="fas fa-globe"></i> Website
                                    </a>
                                    <a
                                        ng-if="plugin.manifest.support"
                                        class="clickable plugin-link-pill"
                                        ng-click="$ctrl.openLink(plugin.manifest.support)"
                                        uib-tooltip="{{plugin.manifest.support}}"
                                        tooltip-append-to-body="true"
                                    >
                                        <i class="fas fa-life-ring"></i> Support
                                    </a>
                                </div>
                            </div>

                            <div style="display:flex; align-items:center; flex-shrink: 0;">
                                <firebot-button
                                    ng-if="plugin.installed !== true && plugin.installing !== true"
                                    text="Install"
                                    type="primary"
                                    icon="fa-download"
                                    disabled="$ctrl.isInstallingPlugin"
                                    ng-click="$ctrl.installCommunityPlugin(plugin)"
                                />
                                <firebot-button
                                    ng-if="plugin.installed !== true && plugin.installing === true"
                                    text="Installing"
                                    type="default"
                                    loading="true"
                                    disabled="true"
                                />
                                <firebot-button
                                    ng-if="plugin.installed === true"
                                    text="v{{plugin.installedVersion}} Installed"
                                    type="default"
                                    icon="fa-check"
                                    disabled="true"
                                />
                            </div>
                        </div>
                        <div class="text-center px-16 mt-8">
                            For even more plugins and lots of other cool stuff our community has made, check out our <a href="https://discord.gg/crowbartools-372817064034959370">Discord</a>!
                        </div>
                    </div>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(
                $rootScope,
                $scope,
                pluginsService,
                modalFactory,
                modalService
            ) {
                const $ctrl = this;

                $ctrl.openLink = $rootScope.openLinkExternally;

                $ctrl.isSearching = false;
                $ctrl.searchPerformed = false;
                $ctrl.searchQuery = "";
                $ctrl.searchResults = [];
                $ctrl.isInstallingPlugin = false;

                $ctrl.performSearch = async () => {
                    if (!$ctrl.searchQuery?.length) {
                        return;
                    }

                    $ctrl.isSearching = true;

                    const results = await pluginsService.searchCommunityPlugins($ctrl.searchQuery);
                    $ctrl.searchResults = results ?? [];

                    $ctrl.searchPerformed = true;
                    $ctrl.isSearching = false;
                };

                $scope.$watch("$ctrl.searchQuery", (newValue, oldValue) => {
                    if (newValue !== oldValue) {
                        if (!!newValue?.length) {
                            $ctrl.performSearch();
                        } else if (newValue === "") {
                            $ctrl.searchPerformed = false;
                            $ctrl.searchResults = [];
                        }
                    }
                });

                $ctrl.getPluginReleaseDate = (plugin) => {
                    if (plugin?.manifest?.releaseDate) {
                        const releaseDate = DateTime.fromISO(plugin.manifest.releaseDate);
                        return releaseDate.toFormat("MMMM d, yyyy");
                    }

                    return "Unknown";
                };

                $ctrl.hasPluginLinks = function(plugin) {
                    const manifest = (plugin && plugin.manifest) || {};
                    return !!(manifest.repo || manifest.website || manifest.support);
                };

                $ctrl.installCommunityPlugin = async (pluginDetails) => {
                    $ctrl.isInstallingPlugin = true;
                    pluginDetails.installing = true;

                    const result = await pluginsService.installCommunityPlugin(pluginDetails);

                    if (result.success === true) {
                        pluginDetails.installed = true;
                        pluginDetails.installedVersion = result.installedPlugin.config.managedPluginDetails.version;

                        modalService.showModal({
                            component: "configurePluginModal",
                            size: "md",
                            backdrop: true,
                            keyboard: true,
                            resolveObj: {
                                plugin: () => result.installedPlugin
                            }
                        });
                    } else {
                        modalFactory.showErrorModal(result.error);
                    }

                    pluginDetails.installing = false;
                    $ctrl.isInstallingPlugin = false;
                };
            }
        });
}());