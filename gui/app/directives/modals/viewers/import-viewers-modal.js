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
                        <div class="mb-10 flex flex-row justify-between items-end">
                            <div>Found {{$ctrl.viewers.length}} viewers to import.</div>
                        </div>
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
            controller: function(backendCommunicator, quotesService, importService) {
                const $ctrl = this;

                $ctrl.onFileSelected = (filepath) => {
                    const data = importService.parseStreamlabsChatbotData(filepath);
                    if (data && data.viewers) {
                        $ctrl.viewers = data.viewers;
                        $ctrl.search = "";
                    }
                };

                // $ctrl.importQuotes = () => {
                //     quotesService.addQuotes($ctrl.quotes);
                // };

                // backendCommunicator.on("quotes-update", () => {
                //     $ctrl.close();
                // });
            }
        });
}());
