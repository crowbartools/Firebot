"use strict";

(function() {
    const uuid = require("uuid/v4");

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
                        <p class="muted mb-12">Currently only viewers from Streamlabs Chatbot (desktop bot) can be imported.</p>

                        <h4 class="font-semibold">Choose file</h4>
                        <p class="muted mb-8">To get the export file in Streamlabs Chatbot, go to Connections -> Cloud -> Create Split Excel and find the file called [Name of the currency].xlsx, or choose Create Excel Files and find the file called Data.xlsx.</p>
                        <file-chooser
                            model="$ctrl.importFilePath"
                            on-update="$ctrl.onFileSelected(filepath)"
                            options="{filters: [ {name: 'Microsoft Excel', extensions: '.xlsx'}]}"
                            hide-manual-edit="true"
                        >
                        </file-chooser>
                        <p ng-if="$ctrl.fileError" style="color: #f96f6f;" class="mt-4">Cannot read this file. Please follow the instructions above.</p>
                    </div>
                    <div ng-show="$ctrl.viewers">
                        <div class="mb-8">
                            <h3 ng-init="hideSettings = false" ng-click="hideSettings = !hideSettings">
                                Settings
                                <i class="far fa-sm ml-4" ng-class="{'fa-chevron-right': hideSettings, 'fa-chevron-down': !hideSettings}"></i>
                            </h3>
                            <div class="mt-8" uib-collapse="hideSettings">
                                <div class="form-group">
                                    <label class="control-fb control--checkbox"> Include view hours
                                        <input type="checkbox" ng-model="$ctrl.settings.viewHours.includeViewHours" ng-click="$ctrl.toggleIncludeViewHours()">
                                        <div class="control__indicator"></div>
                                    </label>
                                    <label ng-if="$ctrl.settings.viewHours.includeViewHours" class="control-fb control--checkbox ml-12"> Include viewers with 0 view hours
                                        <input type="checkbox" ng-model="$ctrl.settings.viewHours.includeZeroHoursViewers" ng-click="$ctrl.toggleIncludeZeroHoursViewers()">
                                        <div class="control__indicator"></div>
                                    </label>
                                </div>

                                <label class="control-fb control--checkbox"> Include currency
                                    <input type="checkbox" ng-model="$ctrl.settings.currency.includeCurrency" ng-click="$ctrl.toggleIncludeCurrency()">
                                    <div class="control__indicator"></div>
                                </label>
                                <div class="ml-12 mb-8" ng-if="$ctrl.settings.currency.includeCurrency">
                                    <label class="control-fb control--checkbox"> Include viewers with 0 currency
                                        <input type="checkbox" ng-model="$ctrl.settings.currency.includeZeroCurrencyViewers" ng-click="$ctrl.toggleIncludeZeroCurrencyViewers()">
                                        <div class="control__indicator"></div>
                                    </label>

                                    <div>
                                        <label class="control-fb control--radio" ng-if="$ctrl.currencies != null && $ctrl.currencies.length">Map to new currency
                                            <input type="radio" ng-model="$ctrl.settings.currency.addNewCurrency" ng-value="true"/>
                                            <div class="control__indicator"></div>
                                        </label>
                                        <div class="form-group" ng-class="{'ml-12': $ctrl.currencies != null && $ctrl.currencies.length}" ng-if="$ctrl.settings.currency.addNewCurrency" style="width: 50%">
                                            <div ng-if="$ctrl.currencies == null || !$ctrl.currencies.length" class="mb-2">
                                                Map Currency To:
                                            </div>
                                            <input
                                                type="text"
                                                id="currencyName"
                                                name="currencyName"
                                                class="form-control input-md"
                                                placeholder="Enter new currency name"
                                                ng-model="$ctrl.settings.currency.currency.name"
                                            />
                                        </div>

                                        <label class="control-fb control--radio" ng-if="$ctrl.currencies != null && $ctrl.currencies.length">Map to existing currency
                                            <input type="radio" ng-model="$ctrl.settings.currency.addNewCurrency" ng-value="false"/>
                                            <div class="control__indicator"></div>
                                        </label>
                                        <div class="btn-group ml-12" ng-if="!$ctrl.settings.currency.addNewCurrency">
                                            <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                                <span>{{$ctrl.currencies[0].name}}</span>
                                                <span class="caret"></span>
                                            </button>
                                            <ul class="dropdown-menu">
                                                <li ng-repeat="currency in $ctrl.currencies" ng-click="$ctrl.settings.currency.currency = currency">
                                                    <a href>{{currency.name}}</a>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="mt-16">
                            <h3 ng-init="hideOverview = false" ng-click="hideOverview = !hideOverview">
                                Overview
                                <i class="far fa-sm ml-4" ng-class="{'fa-chevron-right': hideOverview, 'fa-chevron-down': !hideOverview}"></i>
                            </h3>
                            <div uib-collapse="hideOverview">
                                <div class="mb-10 flex flex-row justify-between items-end">
                                    <div>
                                        Found {{$ctrl.filteredViewers.length}} viewers to import.
                                        <tooltip text="'Viewers that have changed their username in the mean time are included in this number, but will not be imported since their new name is unknown.'"></tooltip>
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
                                    track-by-field="name"
                                    starting-sort-field="viewHours"
                                    sort-initially-reversed="true"
                                    no-data-message="No viewers found"
                                >
                                </sortable-table>
                            </div>
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
            controller: function(backendCommunicator, utilityService, importService, currencyService, logger, ngToast) {
                const $ctrl = this;

                $ctrl.currencies = currencyService.getCurrencies();

                $ctrl.settings = {
                    viewHours: {
                        includeViewHours: true,
                        includeZeroHoursViewers: true
                    },
                    currency: {
                        includeCurrency: true,
                        includeZeroCurrencyViewers: true,
                        addNewCurrency: true,
                        currency: {}
                    }
                };

                $ctrl.headers = [
                    {
                        name: "USERNAME",
                        icon: "fa-user",
                        dataField: "name",
                        sortable: true,
                        cellTemplate: `{{data.name}}`
                    },
                    {
                        name: "CURRENCY",
                        icon: "fa-coin",
                        dataField: "currency",
                        sortable: true,
                        headerStyles: {
                            'width': '125px'
                        },
                        cellStyles: {
                            'width': '125px'
                        },
                        cellTemplate: `{{data.currency}}`
                    },
                    {
                        name: "VIEW HOURS",
                        icon: "fa-tv",
                        dataField: "viewHours",
                        sortable: true,
                        headerStyles: {
                            'width': '125px'
                        },
                        cellStyles: {
                            'width': '125px'
                        },
                        cellTemplate: `{{data.viewHours}}`
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

                $ctrl.toggleIncludeViewHours = () => {
                    $ctrl.settings.viewHours.includeViewHours = !$ctrl.settings.viewHours.includeViewHours;
                };

                $ctrl.toggleIncludeZeroHoursViewers = () => {
                    $ctrl.settings.viewHours.includeZeroHoursViewers = !$ctrl.settings.viewHours.includeZeroHoursViewers;
                    $ctrl.filterViewers();
                };

                $ctrl.toggleIncludeCurrency = () => {
                    $ctrl.settings.currency.includeCurrency = !$ctrl.settings.currency.includeCurrency;

                    if (!$ctrl.settings.currency.includeCurrency) {
                        $ctrl.settings.currency.addNewCurrency = false;
                    }
                };

                $ctrl.toggleIncludeZeroCurrencyViewers = () => {
                    $ctrl.settings.currency.includeZeroCurrencyViewers = !$ctrl.settings.currency.includeZeroCurrencyViewers;
                    $ctrl.filterViewers();
                };

                $ctrl.onFileSelected = (filepath) => {
                    const data = importService.parseStreamlabsChatbotData(filepath);
                    if (data && data.viewers) {
                        $ctrl.viewers = data.viewers;
                        $ctrl.search = "";

                        $ctrl.filteredViewers = $ctrl.viewers;
                    }
                };

                $ctrl.showEditImportedViewerModal = (viewer) => {
                    utilityService.showModal({
                        component: "editImportedViewerModal",
                        size: "sm",
                        resolveObj: {
                            viewer: () => viewer
                        },
                        closeCallback: response => {
                            if (response.action === "delete") {
                                $ctrl.filteredViewers = $ctrl.filteredViewers.filter(v => v.id !== response.viewer.id);
                                return;
                            }

                            const index = $ctrl.filteredViewers.findIndex(v => v.id === response.viewer.id);
                            $ctrl.filteredViewers[index] = response.viewer;
                        }
                    });
                };

                $ctrl.filterViewers = () => {
                    $ctrl.filteredViewers = $ctrl.viewers;
                    if (!$ctrl.settings.viewHours.includeZeroHoursViewers) {
                        $ctrl.filteredViewers = $ctrl.filteredViewers.filter(v => parseInt(v.viewHours) !== 0);
                    }

                    if (!$ctrl.settings.currency.includeZeroCurrencyViewers) {
                        $ctrl.filteredViewers = $ctrl.filteredViewers.filter(v => parseInt(v.currency) !== 0);
                    }
                };

                $ctrl.importViewers = async () => {
                    const data = {
                        viewers: $ctrl.filteredViewers,
                        settings: $ctrl.settings
                    };

                    if ($ctrl.settings.currency.addNewCurrency) {
                        if ($ctrl.settings.currency.includeCurrency && (!$ctrl.settings.currency.currency.name || $ctrl.settings.currency.currency.name == null)) {
                            ngToast.create("Please provide a currency name");

                            return;
                        }

                        $ctrl.settings.currency.currency = {
                            id: uuid(),
                            name: $ctrl.settings.currency.currency.name,
                            active: true,
                            payout: 5,
                            interval: 5,
                            limit: 0,
                            transfer: "Allow",
                            bonus: {}
                        };

                        currencyService.saveCurrency($ctrl.settings.currency.currency);
                    }

                    $ctrl.importing = true;
                    const success = await backendCommunicator.fireEventAsync("importViewers", data);

                    if (success) {
                        logger.debug(`Viewer import completed`);

                        $ctrl.importing = false;
                        $ctrl.close();
                    }
                };
            }
        });
}());
