"use strict";

(function() {
    angular.module("firebotApp")
        .component("importQuotesModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Import Quotes</h4>
                </div>
                <div class="modal-body pb-0">
                    <div ng-hide="$ctrl.quotes">
                        <h4>Import from</h5>
                        <p class="muted mb-12">Currently only quotes from Streamlabs Chatbot (desktop bot) and Mix It Up can be imported.</p>

                        <h4>Choose file</h4>
                        <p class="muted mb-2">To get the export file in Streamlabs Chatbot, go to Connections -> Cloud -> Create Split Excel and find the file called Quotes.xlsx.</p>
                        <p class="muted mb-8">To get the export file in Mix It Up, go to Quotes -> Export Quotes and find the file called Quotes.txt.</p>
                        <file-chooser
                            model="$ctrl.importFilePath"
                            on-update="$ctrl.onFileSelected(filepath)"
                            options="{filters: [ {name: 'Microsoft Excel', extensions: '.xlsx'}, {name: 'Text File', extensions: '.txt'} ]}"
                            hide-manual-edit="true"
                        >
                        </file-chooser>
                        <p ng-if="$ctrl.fileError" style="color: #f96f6f;" class="mt-4">Cannot read this file. Please follow the instructions above.</p>
                    </div>
                    <div ng-show="$ctrl.quotes">
                        <div style="margin: 0 0 25px;display: flex;flex-direction: row;justify-content: space-between;align-items: flex-end;">
                            <div>Found {{$ctrl.quotes.length}} quotes to import.</div>
                            <div style="display: flex;flex-direction: row;justify-content: space-between;">
                                <searchbar placeholder-text="Search quotes..." query="$ctrl.search" style="flex-basis: 250px;"></searchbar>
                            </div>
                        </div>
                        <sortable-table
                            table-data-set="$ctrl.quotes"
                            headers="$ctrl.headers"
                            query="$ctrl.search"
                            clickable="false"
                            track-by-field="_id"
                            starting-sort-field="_id"
                            no-data-message="No quotes found"
                        >
                        </sortable-table>
                    </div>
                </div>
                <div class="modal-footer pt-0">
                    <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                    <button ng-show="$ctrl.quotes" ng-click="$ctrl.importQuotes()" class="btn btn-primary">Import</button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(backendCommunicator, quotesService, importService) {
                const $ctrl = this;

                $ctrl.headers = [
                    {
                        name: "ID",
                        icon: "fa-id-badge",
                        dataField: "_id",
                        sortable: true,
                        cellTemplate: `{{data._id}}`
                    },
                    {
                        name: "QUOTE",
                        icon: "fa-quote-right",
                        dataField: "text",
                        cellTemplate: `{{data.text}}`
                    },
                    {
                        name: "DATE",
                        icon: "fa-calendar",
                        dataField: "date",
                        headerStyles: {
                            'padding': '0px 15px'
                        },
                        cellStyles: {
                            'padding': '0px 15px'
                        },
                        cellTemplate: `{{data.createdAt | prettyDate}}`
                    },
                    {
                        name: "GAME",
                        icon: "fa-gamepad-alt",
                        dataField: "game",
                        headerStyles: {
                            'width': '175px'
                        },
                        cellStyles: {
                            'width': '175px'
                        },
                        cellTemplate: `{{data.game}}`
                    }
                ];

                $ctrl.onFileSelected = (filepath) => {
                    //get the file type from the filepath
                    const fileType = filepath.split(".").pop();
                    let data;
                    if (fileType === "xlsx") {
                        data = importService.parseStreamlabsChatbotData(filepath);
                    } else if (fileType === "txt") {
                        data = importService.parseMixItUpData(filepath, "quotes");
                    }
                    if (data && data.quotes) {
                        $ctrl.quotes = data.quotes;
                        $ctrl.search = "";
                    } else {
                        $ctrl.fileError = true;
                    }
                };

                $ctrl.importQuotes = () => {
                    quotesService.addQuotes($ctrl.quotes);
                };

                backendCommunicator.on("quotes-update", () => {
                    $ctrl.close();
                });
            }
        });
}());
