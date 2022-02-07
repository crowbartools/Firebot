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
                        <h4>Import from</h5>
                        <p class="muted mb-12">Currently only viewers from Streamlabs Chatbot (desktop bot) can be imported.</p>

                        <h4>Choose file</h4>
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
                            <h3>Settings</h3>
                            <label class="control-fb control--checkbox mt-8"> Include viewers with 0 view hours
                                <input type="checkbox" ng-checked="$ctrl.includeZeroHourViewers" ng-click="$ctrl.toggleZeroHourViewersIncluded()">
                                <div class="control__indicator"></div>
                            </label>
                        </div>
                        <div class="mb-10 flex flex-row justify-between items-end">
                            <div>Found {{$ctrl.viewers.length}} viewers to import.</div>
                            <div class="flex justify-between">
                                <searchbar placeholder-text="Search viewers..." query="$ctrl.search" style="flex-basis: 250px;"></searchbar>
                            </div>
                        </div>
                        <sortable-table
                            table-data-set="$ctrl.viewers"
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
                <div class="modal-footer pt-0" style="text-align: center;">
                    <button ng-show="$ctrl.viewers" ng-click="$ctrl.importViewers()" class="btn btn-primary">Import</button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(utilityService, importService) {
                const $ctrl = this;

                $ctrl.includeZeroHourViewers = true;

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

                        $ctrl.zeroHourViewersincluded = $ctrl.viewers;
                        $ctrl.zeroHourViewersExcluded = $ctrl.viewers.filter(v => parseInt(v.viewHours) !== 0);
                    }
                };

                $ctrl.deleteImportedViewer = (id) => {
                    $ctrl.viewers = $ctrl.viewers.filter(v => v.id !== id);
                    $ctrl.zeroHourViewersincluded = $ctrl.zeroHourViewersincluded.filter(v => v.id !== id);
                    $ctrl.zeroHourViewersExcluded = $ctrl.zeroHourViewersExcluded.filter(v => v.id !== id);
                };

                $ctrl.editImportedViewer = (viewer) => {
                    const index = $ctrl.viewers.findIndex(v => v.id === viewer.id);
                    $ctrl.viewers[index] = viewer;
                    $ctrl.zeroHourViewersincluded[index] = viewer;
                    $ctrl.zeroHourViewersExcluded[index] = viewer;
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
                                $ctrl.deleteImportedViewer(response.viewer.id);
                                return;
                            }

                            $ctrl.editImportedViewer(response.viewer);
                        }
                    });
                };

                $ctrl.toggleZeroHourViewersIncluded = () => {
                    $ctrl.includeZeroHourViewers = !$ctrl.includeZeroHourViewers;

                    $ctrl.viewers = $ctrl.includeZeroHourViewers ? $ctrl.zeroHourViewersincluded : $ctrl.zeroHourViewersExcluded;
                };
            }
        });
}());
