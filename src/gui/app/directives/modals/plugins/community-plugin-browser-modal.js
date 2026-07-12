"use strict";

(function() {
    const { DateTime } = require("luxon");
    const { PluginCategory, PluginCategoryLabels, PluginFeature, PluginFeatureLabels } = require("../../shared/plugin-constants");

    const PAGE_SIZE = 20;
    const SCROLL_THRESHOLD_PX = 300;

    angular
        .module("firebotApp")
        .component("communityPluginBrowserModal", {
            template: `
                <div class="plugin-browser-header modal-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Community Plugins</h4>
                </div>
                <div class="modal-body" style="padding: 0;">
                    <div class="plugin-browser-toolbar">
                        <div style="flex: 1;">
                            <searchbar
                                search-id="pluginBrowserSearch"
                                query="$ctrl.searchQuery"
                                placeholder-text="Search community plugins..."
                                debounce="500"
                            />
                        </div>
                        <div
                            style="position: relative; flex-shrink: 0;"
                            uib-popover-template="'pluginFiltersPopover.html'"
                            popover-is-open="$ctrl.filtersPopoverOpen"
                            popover-placement="auto bottom-right"
                            popover-append-to-body="true"
                            popover-trigger="'outsideClick'"
                            popover-class="plugin-filters-popover"
                        >
                            <firebot-button
                                text="Sort & Filter"
                                icon="fa-sliders-h"
                                type="default"
                            />
                            <span
                                ng-if="$ctrl.selectedFeatureCount() > 0"
                                class="plugin-filters-badge"
                            >{{$ctrl.selectedFeatureCount()}}</span>
                        </div>
                        <script type="text/ng-template" id="pluginFiltersPopover.html">
                            <div class="plugin-filters-panel">
                                <div class="plugin-filters-section-header muted">Sort By</div>
                                <div
                                    class="plugin-filters-sort-option"
                                    ng-repeat="option in $ctrl.sortOptions"
                                    ng-class="{'selected': $ctrl.sortBy === option.value}"
                                    ng-click="$ctrl.setSortBy(option.value)"
                                >
                                    <i class="far fa-fw" ng-class="option.icon"></i>
                                    <span style="flex: 1;">{{option.name}}</span>
                                    <i class="fas fa-check" ng-if="$ctrl.sortBy === option.value"></i>
                                </div>
                                <hr class="divider" style="margin: 8px 0;" />
                                <div class="plugin-filters-section-header muted" style="display: flex; align-items: center; justify-content: space-between;">
                                    <span>Features</span>
                                    <a
                                        class="clickable"
                                        style="text-transform: none; font-weight: 400;"
                                        ng-if="$ctrl.selectedFeatureCount() > 0"
                                        ng-click="$ctrl.clearFeatures()"
                                    >Clear</a>
                                </div>
                                <firebot-checkbox
                                    ng-repeat="feature in $ctrl.features"
                                    label="{{$ctrl.featureLabels[feature]}}"
                                    model="$ctrl.selectedFeatures[feature]"
                                    on-change="$ctrl.onFeatureToggled(feature, newValue)"
                                    style="margin-bottom: 0;"
                                />
                            </div>
                        </script>
                    </div>
                    <div style="display: flex; flex-direction: row; height: 450px;">
                        <div class="plugin-browser-categories">
                            <div class="plugin-browser-category-header muted">Categories</div>
                            <div
                                class="plugin-browser-category"
                                ng-class="{'selected': $ctrl.activeCategory == null}"
                                ng-click="$ctrl.selectCategory(null)"
                            >All</div>
                            <div
                                class="plugin-browser-category"
                                ng-class="{'selected': $ctrl.activeCategory === 'official'}"
                                ng-click="$ctrl.selectCategory('official')"
                            >Official</div>
                            <div
                                class="plugin-browser-category"
                                ng-repeat="category in $ctrl.categories"
                                ng-class="{'selected': $ctrl.activeCategory === category}"
                                ng-click="$ctrl.selectCategory(category)"
                            >{{$ctrl.categoryLabels[category]}}</div>
                        </div>
                        <div class="plugin-browser-list" id="pluginBrowserList">
                            <div
                                ng-if="$ctrl.isLoading"
                                class="flex flex-column items-center justify-center gap-4 p-4 my-20"
                            >
                                <div class="loader"></div>
                            </div>
                            <div
                                ng-if="!$ctrl.isLoading && $ctrl.plugins.length === 0"
                                class="flex flex-column items-center justify-center gap-4 p-4 my-20"
                            >
                                <i class="fal fa-exclamation text-7xl"></i>
                                <h2 class="text-5xl m-0 font-black">No Plugins Found</h2>
                                <p class="text-center px-32">Well this is embarrassing. It doesn't look like we can find any plugins that match.</p>
                                <p class="text-center px-32">But don't worry! There are still plenty of great Firebot plugins out there. Check out our <a href="https://discord.gg/crowbartools-372817064034959370">Discord</a> to see all the cool stuff our community has made.</p>
                            </div>
                            <div ng-if="!$ctrl.isLoading && $ctrl.plugins.length > 0" class="flex flex-column gap-4">
                                <div
                                    ng-repeat="plugin in $ctrl.plugins track by (plugin.author + ':' + plugin.name)"
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
                                <div ng-if="$ctrl.isLoadingMore" style="display: flex; justify-content: center; padding: 10px 0;">
                                    <div class="loader"></div>
                                </div>
                                <div ng-if="!$ctrl.hasMore()" class="text-center px-16 py-8">
                                    For even more plugins and lots of other cool stuff our community has made, check out our <a href="https://discord.gg/crowbartools-372817064034959370">Discord</a>!
                                </div>
                            </div>
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
                $timeout,
                pluginsService,
                modalFactory,
                modalService,
                ngToast
            ) {
                const $ctrl = this;

                $ctrl.openLink = $rootScope.openLinkExternally;

                $ctrl.categories = Object.values(PluginCategory);
                $ctrl.categoryLabels = PluginCategoryLabels;
                $ctrl.activeCategory = null;
                $ctrl.searchQuery = "";
                $ctrl.sortBy = "name";
                $ctrl.sortOptions = [
                    { name: "Name (A-Z)", value: "name", icon: "fa-sort-alpha-down" },
                    { name: "Popular", value: "popular", icon: "fa-fire" },
                    { name: "Recently Updated", value: "recently-updated", icon: "fa-clock" }
                ];

                $ctrl.features = Object.values(PluginFeature);
                $ctrl.featureLabels = PluginFeatureLabels;
                $ctrl.selectedFeatures = {};
                $ctrl.filtersPopoverOpen = false;

                $ctrl.plugins = [];
                $ctrl.total = 0;
                $ctrl.isLoading = false;
                $ctrl.isLoadingMore = false;
                $ctrl.isInstallingPlugin = false;

                let currentPage = 1;
                let requestId = 0;

                $ctrl.hasMore = () => $ctrl.plugins.length < $ctrl.total;

                const getSelectedFeatures = () =>
                    Object.keys($ctrl.selectedFeatures).filter(f => $ctrl.selectedFeatures[f] === true);

                $ctrl.selectedFeatureCount = () => getSelectedFeatures().length;

                const fetchPage = async (page) => {
                    const thisRequest = ++requestId;
                    const features = getSelectedFeatures();

                    // "official" is a pseudo-category treated as a filter by the api
                    const officialSelected = $ctrl.activeCategory === "official";

                    const result = await pluginsService.searchCommunityPlugins({
                        query: $ctrl.searchQuery?.trim() || undefined,
                        category: officialSelected ? undefined : ($ctrl.activeCategory ?? undefined),
                        official: officialSelected || undefined,
                        features: features.length ? features : undefined,
                        sortBy: $ctrl.sortBy,
                        page,
                        pageSize: PAGE_SIZE
                    });

                    // Discard stale responses from superseded requests
                    if (thisRequest !== requestId) {
                        return null;
                    }

                    return result ?? { items: [], total: 0 };
                };

                $ctrl.reload = async () => {
                    $ctrl.isLoading = true;

                    const result = await fetchPage(1);
                    if (result == null) {
                        return;
                    }

                    currentPage = 1;
                    $ctrl.plugins = result.items;
                    $ctrl.total = result.total;
                    $ctrl.isLoading = false;

                    const listEl = document.getElementById("pluginBrowserList");
                    if (listEl) {
                        listEl.scrollTop = 0;
                    }
                };

                $ctrl.loadMore = async () => {
                    if ($ctrl.isLoading || $ctrl.isLoadingMore || !$ctrl.hasMore()) {
                        return;
                    }

                    $ctrl.isLoadingMore = true;

                    const result = await fetchPage(currentPage + 1);
                    if (result != null) {
                        currentPage += 1;
                        $ctrl.plugins = $ctrl.plugins.concat(result.items);
                        $ctrl.total = result.total;
                    }

                    $ctrl.isLoadingMore = false;
                };

                $ctrl.selectCategory = (category) => {
                    if ($ctrl.activeCategory !== category) {
                        $ctrl.activeCategory = category;
                        $ctrl.reload();
                    }
                };

                $ctrl.setSortBy = (sortBy) => {
                    if ($ctrl.sortBy !== sortBy) {
                        $ctrl.sortBy = sortBy;
                        $ctrl.reload();
                    }
                };

                $ctrl.onFeatureToggled = (feature, isSelected) => {
                    $ctrl.selectedFeatures[feature] = isSelected === true;
                    $ctrl.reload();
                };

                $ctrl.clearFeatures = () => {
                    $ctrl.selectedFeatures = {};
                    $ctrl.reload();
                };

                $scope.$watch("$ctrl.searchQuery", (newValue, oldValue) => {
                    if (newValue !== oldValue) {
                        $ctrl.reload();
                    }
                });

                $ctrl.$onInit = () => {
                    $ctrl.reload();

                    $timeout(() => {
                        const listEl = document.getElementById("pluginBrowserList");
                        listEl?.addEventListener("scroll", () => {
                            if (listEl.scrollTop + listEl.clientHeight >= listEl.scrollHeight - SCROLL_THRESHOLD_PX) {
                                $scope.$applyAsync(() => $ctrl.loadMore());
                            }
                        });

                        angular.element("#pluginBrowserSearch").trigger("focus");
                    }, 100);
                };

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

                        ngToast.create({
                            className: "success",
                            content: `${result.installedPlugin.details.manifest.name} plugin installed!`
                        });

                        if (!!result.installedPlugin.details.parametersSchema?.length) {
                            modalService.showModal({
                                component: "configurePluginModal",
                                size: "md",
                                resolveObj: {
                                    plugin: () => result.installedPlugin
                                }
                            });
                        }
                    } else {
                        modalFactory.showErrorModal(result.error);
                    }

                    pluginDetails.installing = false;
                    $ctrl.isInstallingPlugin = false;
                };
            }
        });
}());
