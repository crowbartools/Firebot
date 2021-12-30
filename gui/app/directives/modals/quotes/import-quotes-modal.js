"use strict";

(function() {
    const xlsx = require("node-xlsx").default;
    const fs = require("fs-extra");
    const moment = require("moment");

    angular.module("firebotApp")
        .component("importQuotesModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Import Quotes</h4>
                </div>
                <div class="modal-body">
                    <div ng-hide="$ctrl.fileSelected">
                        <h4>Import from</h5>
                        <p class="muted mb-12">Currently only quotes from Streamlabs Chatbot (desktop bot) can be imported.</p>

                        <h4>Choose file</h4>
                        <p class="muted mb-8">To get the export file in Streamlabs Chatbot, go to Connections -> Cloud and click 'Create Split Excel</p>
                        <file-chooser
                            model="$ctrl.importFilePath"
                            on-update="$ctrl.onFileSelected(filepath)"
                            options="{filters: [ {name: 'Microsoft Excel', extensions: '.xlsx'}]}"
                            hide-manual-edit="true"
                        >
                        </file-chooser>
                    </div>
                    <div ng-show="$ctrl.fileSelected">
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
                <div class="modal-footer" style="text-align: center;">
                    <button ng-show="$ctrl.fileSelected" ng-click="$ctrl.importQuotesFromSLChatbot()" class="btn btn-primary">Import</button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(backendCommunicator, quotesService) {
                const $ctrl = this;

                $ctrl.fileSelected = false;

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
                        dataField: "quote",
                        cellTemplate: `{{data.text}}`
                    }
                ];

                $ctrl.onFileSelected = (filepath) => {
                    const file = xlsx.parse(fs.readFileSync(filepath));

                    if (file && file[0].name && file[0].name === "Quotes") {
                        $ctrl.quotes = file[0].data
                            .filter(q => q[0] !== "ID")
                            .map(q => {
                                return {
                                    _id: q[0] + 1,
                                    text: q[1]
                                };
                            });

                        $ctrl.fileSelected = true;
                        $ctrl.search = "";
                    }
                };

                const getDateFormat = (quotes) => {
                    let dateFormat = null;

                    quotes.forEach(q => {
                        const dateArray = q.createdAt.split("-");

                        if (parseInt(dateArray[0]) > 12) {
                            dateFormat = "DD-MM-YYYY";
                            return false;
                        } else if (parseInt(dateArray[1]) > 12) {
                            dateFormat = "MM-DD-YYYY";
                            return false;
                        }
                    });

                    return dateFormat;
                };

                const getSplittedQuotes = () => {
                    return $ctrl.quotes.map(q => {
                        const splittedQuote = q.text.split("[").map(sq => sq.replace("]", "").trim());

                        if (splittedQuote.length > 3) {
                            splittedQuote[0] = splittedQuote.slice(0, splittedQuote.length - 2).join(" ");
                        }

                        return {
                            text: splittedQuote[0],
                            game: splittedQuote[splittedQuote.length - 2],
                            createdAt: splittedQuote[splittedQuote.length - 1]
                        };
                    });
                };

                $ctrl.importQuotesFromSLChatbot = () => {
                    const parsedQuotes = getSplittedQuotes();
                    const dateFormat = getDateFormat(parsedQuotes);

                    let lastId = quotesService.quotes.length;
                    const quotesToImport = parsedQuotes.map(q => {
                        lastId += 1;

                        return {
                            _id: lastId,
                            text: q.text,
                            originator: "",
                            creator: "",
                            game: q.game,
                            createdAt: moment(q.createdAt, dateFormat).toISOString()
                        };
                    });

                    quotesService.addQuotes(quotesToImport);
                };

                backendCommunicator.on("quotes-update", () => {
                    $ctrl.close();
                });
            }
        });
}());
