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
                            <h4 class="font-semibold">Settings</h4>
                            <div class="mt-8">
                                <div class="mb-10">
                                    <label class="control-fb control--checkbox"> Include view hours
                                        <input type="checkbox" ng-model="$ctrl.settings.viewHours.includeViewHours" ng-click="$ctrl.settings.viewHours.includeViewHours = !$ctrl.settings.viewHours.includeViewHours">
                                        <div class="control__indicator"></div>
                                    </label>
                                    <label ng-if="$ctrl.settings.viewHours.includeViewHours" class="control-fb control--checkbox ml-4"> Include viewers with 0 view hours
                                        <input type="checkbox" ng-model="$ctrl.settings.viewHours.includeZeroHoursViewers" ng-click="$ctrl.settings.viewHours.includeZeroHoursViewers = !$ctrl.settings.viewHours.includeZeroHoursViewers; $ctrl.filterViewers();">
                                        <div class="control__indicator"></div>
                                    </label>
                                </div>

                                <label class="control-fb control--checkbox"> Include currency
                                    <input type="checkbox" ng-model="$ctrl.settings.currency.includeCurrency" ng-click="$ctrl.settings.currency.includeCurrency = !$ctrl.settings.currency.includeCurrency">
                                    <div class="control__indicator"></div>
                                </label>
                                <div class="ml-4 mb-8" ng-if="$ctrl.settings.currency.includeCurrency">
                                    <label class="control-fb control--checkbox"> Include viewers with 0 currency
                                        <input type="checkbox" ng-model="$ctrl.settings.currency.includeZeroCurrencyViewers" ng-click="$ctrl.settings.currency.includeZeroCurrencyViewers = !$ctrl.settings.currency.includeZeroCurrencyViewers; $ctrl.filterViewers();">
                                        <div class="control__indicator"></div>
                                    </label>

                                    <label class="control-fb control--checkbox" ng-if="$ctrl.currencies != null && $ctrl.currencies.length"> Map to existing currency
                                        <input type="checkbox" ng-model="$ctrl.settings.currency.mapToExistingCurrency" ng-click="$ctrl.settings.currency.mapToExistingCurrency = !$ctrl.settings.currency.mapToExistingCurrency;">
                                        <div class="control__indicator"></div>
                                    </label>
                                    <div class="btn-group ml-2" ng-if="$ctrl.settings.currency.mapToExistingCurrency">
                                        <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            <span>{{$ctrl.settings.currency.currency != null ? $ctrl.settings.currency.currency.name : 'Select Currency' }}</span> <span class="caret"></span>
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
                        <div class="mb-10 flex flex-row justify-between items-end">
                            <div>Found {{$ctrl.filteredViewers.length}} viewers to import.</div>
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
                <div class="modal-footer pt-0">
                    <button ng-show="$ctrl.viewers" ng-click="$ctrl.importViewers()" class="btn btn-primary">Import</button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(utilityService, importService, currencyService) {
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
                        mapToExistingCurrency: false,
                        currency: null
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
                        icon: "fa-clock",
                        dataField: "viewHours",
                        sortable: true,
                        headerStyles: {
                            'width': '125px'
                        },
                        cellStyles: {
                            'width': '125px'
                        },
                        cellTemplate: `{{data.viewHours}}`
                    }
                ];

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
            }
        });
}());
