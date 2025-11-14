"use strict";

(function() {
    angular.module("firebotApp")
        .component("importViewersModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Import Viewers</h4>
                </div>
                <div class="modal-body pb-0">
                    <div ng-hide="$ctrl.viewers">
                        <h4 class="font-semibold">Import from</h4>
                        <p class="muted mb-12">Currently only viewers from Streamlabs Chatbot (desktop bot) and Firebot can be imported.</p>

                        <h4 class="font-semibold">Choose file</h4>
                        <p class="muted mb-8">To get the export file in Streamlabs Chatbot, go to Connections -> Cloud -> Create Split Excel and find the file called [Name of the currency].xlsx, or choose Create Excel Files and find the file called Data.xlsx.</p>
                        <file-chooser
                            model="$ctrl.importFilePath"
                            on-update="$ctrl.onFileSelected(filepath)"
                            options="{filters: [ {name: 'Microsoft Excel', extensions: '.xlsx'}, {name: 'CSV File', extensions: '.csv'}]}"
                            hide-manual-edit="true"
                        >
                        </file-chooser>
                        <p ng-if="$ctrl.fileError" style="color: #f96f6f;" class="mt-4">Cannot read this file. Please follow the instructions above.</p>
                    </div>
                    <div ng-show="$ctrl.viewers">
                        <div class="mb-8">
                            <h3>Settings</h3>
                            <div class="mt-8" ng-if="$ctrl.importer === 'streamlabs'">
                                <div class="form-group">
                                    <label class="control-fb control--checkbox"> Include view time
                                        <input type="checkbox" ng-model="$ctrl.settings.includeViewTime" ng-click="$ctrl.toggleIncludeViewTime()">
                                        <div class="control__indicator"></div>
                                    </label>
                                    <label ng-if="$ctrl.settings.includeViewTime" class="control-fb control--checkbox"> Include viewers with 0 view time
                                        <input type="checkbox" ng-model="$ctrl.settings.includeZeroViewTimeViewers" ng-click="$ctrl.toggleIncludeZeroViewTimeViewers()">
                                        <div class="control__indicator"></div>
                                    </label>
                                </div>
                            </div>
                            <div class="mt-8" ng-if="$ctrl.importer === 'firebot'">
                                <div class="form-group">
                                    <label class="control-fb control--checkbox" style="font-weight: 300"> Include viewers with 0 view time
                                        <input type="checkbox" ng-model="$ctrl.settings.includeZeroViewTimeViewers" ng-click="$ctrl.toggleIncludeZeroViewTimeViewers()">
                                        <div class="control__indicator"></div>
                                    </label>
                                    <div class="controls-fb-inline mt-10">
                                        <h4 class="font-medium">When a viewer already exists:</h4>
                                        <label class="control-fb control--radio" style="font-weight: 300">Merge
                                            <input type="radio" ng-model="$ctrl.settings.existingViewers" value="merge"/> 
                                            <div class="control__indicator"></div>
                                        </label>
                                        <label class="control-fb control--radio" style="font-weight: 300">Replace
                                            <input type="radio" ng-model="$ctrl.settings.existingViewers" value="replace"/>
                                            <div class="control__indicator"></div>
                                        </label>
                                        <label class="control-fb control--radio" style="font-weight: 300">Skip
                                            <input type="radio" ng-model="$ctrl.settings.existingViewers" value="skip"/>
                                            <div class="control__indicator"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="mt-16 mb-4">
                            <h3>Overview</h3>
                            <div class="mb-10 flex flex-row justify-between items-end">
                                <div>
                                    Found {{$ctrl.filteredViewers.length}} viewers to import.
                                    <tooltip 
                                        ng-if="$ctrl.importer === 'streamlabs'"
                                        text="'Viewers that have changed their username in the mean time are included in this number, but will not be imported since their new name is unknown.'"
                                    ></tooltip>
                                </div>
                                <div class="flex justify-between">
                                    <searchbar placeholder-text="Search viewers..." query="$ctrl.search" style="flex-basis: 250px;"></searchbar>
                                </div>
                            </div>
                            <sortable-table
                                table-data-set="$ctrl.filteredViewers"
                                headers="$ctrl.headers"
                                query="$ctrl.search"
                                clickable="true"
                                on-row-click="$ctrl.showEditImportedViewerModal(data)"
                                track-by-field="username"
                                starting-sort-field="minutesInChannel"
                                sort-initially-reversed="true"
                                no-data-message="No viewers found"
                            >
                            </sortable-table>
                        </div>
                    </div>
                </div>
                <div class="modal-footer pt-0">
                    <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                    <button ng-show="$ctrl.filteredViewers" ng-click="$ctrl.importViewers()" class="btn btn-primary" ng-disabled="$ctrl.importing">
                        {{$ctrl.importing ? 'Importing...' : 'Import'}}
                    </button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(backendCommunicator, utilityService, importService, logger) {
                const $ctrl = this;

                $ctrl.headers = [
                    {
                        name: "USERNAME",
                        icon: "fa-user",
                        dataField: "username",
                        sortable: true,
                        cellTemplate: `{{data.username}}`
                    },
                    {
                        name: "JOIN DATE",
                        icon: "fa-tv",
                        dataField: "joinDate",
                        sortable: true,
                        headerStyles: {
                            'width': '125px'
                        },
                        cellStyles: {
                            'width': '125px'
                        },
                        cellTemplate: `{{data.joinDate | prettyDate}}`
                    },
                                        {
                        name: "LAST SEEN",
                        icon: "fa-tv",
                        dataField: "lastSeen",
                        sortable: true,
                        headerStyles: {
                            'width': '125px'
                        },
                        cellStyles: {
                            'width': '125px'
                        },
                        cellTemplate: `{{data.lastSeen | prettyDate}}`
                    },
                    {
                        name: "VIEW TIME (IN HOURS)",
                        icon: "fa-tv",
                        dataField: "minutesInChannel",
                        sortable: true,
                        headerStyles: {
                            'width': '175px'
                        },
                        cellStyles: {
                            'width': '175px'
                        },
                        cellTemplate: `{{data.minutesInChannel / 60 | number:0}}`
                    },
                                        {
                        name: "CHAT MESSAGES",
                        icon: "fa-tv",
                        dataField: "chatMessages",
                        sortable: true,
                        headerStyles: {
                            'width': '125px'
                        },
                        cellStyles: {
                            'width': '125px'
                        },
                        cellTemplate: `{{data.chatMessages}}`
                    },
                    {
                        headerStyles: {
                            'width': '15px'
                        },
                        cellStyles: {
                            'width': '15px'
                        },
                        sortable: false,
                        cellTemplate: `<i class="fal fa-chevron-right"></i>`
                    }
                ];

                $ctrl.toggleIncludeViewTime = () => {
                    $ctrl.settings.includeViewTime = !$ctrl.settings.includeViewTime;
                };

                $ctrl.toggleIncludeZeroViewTimeViewers = () => {
                    $ctrl.settings.includeZeroViewTimeViewers = !$ctrl.settings.includeZeroViewTimeViewers;

                    if (!$ctrl.settings.includeZeroViewTimeViewers) {
                        $ctrl.filteredViewers = $ctrl.viewers.filter(v => parseInt(v.minutesInChannel) !== 0);
                    } else {
                        $ctrl.filteredViewers = $ctrl.viewers;
                    }
                };

                $ctrl.onFileSelected = async (filepath) => {
                    const fileType = filepath.split(".").pop();
                    let data;
                    if (fileType === "xlsx") {
                        $ctrl.importer = "streamlabs-chatbot";
                        data = await importService.loadViewers($ctrl.importer, filepath);

                        if (data && data.viewers) {
                            $ctrl.viewers = data.viewers.map(v => {
                                return {
                                    id: v.id,
                                    username: v.displayName,
                                    minutesInChannel: Math.round(v.viewHours / 60),
                                    chatMessages: 0,
                                    joinDate: Date.now(),
                                    lastSeen: Date.now()
                                }
                            });

                            $ctrl.settings = {
                                includeViewTime: true,
                                includeZeroViewTimeViewers: true
                            };

                            $ctrl.search = "";

                            $ctrl.filteredViewers = $ctrl.viewers;
                        } else {
                            $ctrl.fileError = true;
                        }
                    } else if (fileType === "csv") {
                        $ctrl.importer = "firebot";
                        data = await importService.loadViewers($ctrl.importer, filepath);

                        if (data && data.viewers) {
                            $ctrl.viewers = data.viewers.map(v => {
                                return {
                                    id: v.id,
                                    username: v.displayName,
                                    minutesInChannel: v.minutesInChannel,
                                    chatMessages: v.chatMessages,
                                    joinDate: v.joinDate,
                                    lastSeen: v.lastSeen
                                }
                            });

                            $ctrl.settings = {
                                includeZeroViewTimeViewers: true,
                                existingViewers: "merge"
                            };

                            $ctrl.search = "";

                            $ctrl.filteredViewers = $ctrl.viewers;
                        } else {
                            $ctrl.fileError = true;
                        }
                    }

                    
                };

                $ctrl.showEditImportedViewerModal = (viewer) => {
                    utilityService.showModal({
                        component: "editImportedViewerModal",
                        size: "sm",
                        resolveObj: {
                            viewer: () => viewer
                        },
                        closeCallback: (response) => {
                            if (response.action === "delete") {
                                $ctrl.filteredViewers = $ctrl.filteredViewers.filter(v => v.id !== response.viewer.id);
                                return;
                            }

                            const index = $ctrl.filteredViewers.findIndex(v => v.id === response.viewer.id);
                            $ctrl.filteredViewers[index] = response.viewer;
                        }
                    });
                };

                $ctrl.importViewers = async () => {
                    let data;
                    if ($ctrl.importer === "streamlabs-chatbot") {
                        data = {
                            appId: "streamlabs-chatbot",
                            data: $ctrl.filteredViewers,
                            settings: $ctrl.settings
                        };
                    } else if ($ctrl.importer === "firebot") {
                        data = {
                            appId: "firebot",
                            data: $ctrl.filteredViewers,
                            settings: $ctrl.settings
                        };
                    }

                    $ctrl.importing = true;
                    /** @type {import("../../../../../types/import").ImportResult} */
                    const response = await backendCommunicator.fireEventAsync("import:import-viewers", data);

                    if (response.success) {
                        logger.debug(`Viewer import completed`);

                        $ctrl.importing = false;
                        $ctrl.close();
                    }
                };
            }
        });
}());