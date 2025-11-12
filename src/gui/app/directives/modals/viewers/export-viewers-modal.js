"use strict";

(function() {
    angular.module("firebotApp")
        .component("exportViewersModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Export Viewers</h4>
                </div>
                <div class="modal-body">
                    <h4 class="font-semibold">Choose Categories</h4>
                    <p class="muted">Each category will be exported to its own file, if any data is available for it.</p>
                    <div class="form-group">
                        <label class="control-fb control--checkbox"> Viewers
                            <input type="checkbox" ng-model="$ctrl.exportOptions.viewers" ng-click="$ctrl.toggleExportViewers()">
                            <div class="control__indicator"></div>
                        </label>
                        <label class="control-fb control--checkbox"> Currencies
                            <input type="checkbox" ng-model="$ctrl.exportOptions.currencies" ng-click="$ctrl.toggleExportCurrencies()">
                            <div class="control__indicator"></div>
                        </label>
                        <label class="control-fb control--checkbox"> Ranks
                            <input type="checkbox" ng-model="$ctrl.exportOptions.ranks" ng-click="$ctrl.toggleExportRanks()">
                            <div class="control__indicator"></div>
                        </label>
                    </div>

                    <div class="mt-14">
                        <h4 class="font-semibold">Choose Folder</h4>
                        <p class="muted">This is where the files will be stored.</p>
                        <file-chooser
                            model="$ctrl.folderpath"
                            options="{ directoryOnly: true, filters: [], title: 'Select Folder'}"
                        />
                    </div>
                </div>
                <div class="modal-footer pt-0">
                    <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                    <button ng-click="$ctrl.exportViewers()" class="btn btn-primary" ng-disabled="$ctrl.exporting">
                        {{$ctrl.exporting ? 'Exporting...' : 'Export'}}
                    </button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(backendCommunicator, logger) {
                const $ctrl = this;

                $ctrl.folderpath = "";
                $ctrl.exportOptions = {
                    viewers: true,
                    currencies: true,
                    ranks: true
                };

                $ctrl.toggleExportViewers = () => {
                    $ctrl.exportOptions.viewers = !$ctrl.exportOptions.viewers;
                };

                $ctrl.toggleExportCurrencies = () => {
                    $ctrl.exportOptions.currencies = !$ctrl.exportOptions.currencies;
                };

                $ctrl.toggleExportRanks = () => {
                    $ctrl.exportOptions.ranks = !$ctrl.exportOptions.ranks;
                };

                $ctrl.exportViewers = async () => {
                    $ctrl.exporting = true;

                    const success = await backendCommunicator.fireEventAsync("export-viewers", {
                        folderpath: $ctrl.folderpath, exportOptions: $ctrl.exportOptions 
                    });

                    if (success) {
                        logger.debug(`Viewer export completed`);

                        $ctrl.exporting = false;
                        $ctrl.close({
                            $value: {
                                success: success
                            }
                        });
                    }
                };
            }
        });
}());