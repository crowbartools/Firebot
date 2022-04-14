"use strict";

(function() {

    const fs = require("fs");

    angular.module("firebotApp")
        .component("editUrlAllowlistModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Edit URL Allowlist</h4>
            </div>
            <div class="modal-body">
                <p class="muted" style="margin-bottom:10px;">URLs found in messages containing any words or phrases listed here will be automatically allowed.</p>
                <p class="muted" style="margin-bottom:20px;">NOTE: If multiple URLs are found in a message and ANY of them are not allowed, the entire message will be deleted.</p>
                <div style="margin: 0 0 25px;display: flex;flex-direction: row;">

                    <div class="dropdown">
                        <button class="btn btn-primary dropdown-toggle" type="button" id="add-options" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                            <span class="dropdown-text"><i class="fas fa-plus-circle"></i> Add Word(s)</span>
                            <span class="caret"></span>
                        </button>
                        <ul class="dropdown-menu" aria-labelledby="add-options">
                            <li role="menuitem" ng-click="$ctrl.addWord()"><a href style="padding-left: 10px;"><i class="fad fa-plus-circle" style="margin-right: 5px;"></i> Add single word</a></li>
                            <li role="menuitem" ng-click="$ctrl.showImportModal()"><a href style="padding-left: 10px;"><i class="fad fa-file-import" style="margin-right: 5px;"></i> Import from .txt file <tooltip text="'Import a list of words/phrases from a txt file'"></tooltip></a></li>
                        </ul>
                    </div>

                    <div style="display: flex;flex-direction: row;justify-content: space-between;margin-left: auto;">
                        <searchbar placeholder-text="Search words..." query="$ctrl.search" style="flex-basis: 250px;"></searchbar>
                    </div>
                </div>
                <div>
                    <sortable-table
                        table-data-set="$ctrl.cms.chatModerationData.urlAllowlist"
                        headers="$ctrl.wordHeaders"
                        query="$ctrl.search"
                        clickable="false"
                        starting-sort-field="createdAt"
                        sort-initially-reversed="true"
                        page-size="5"
                        no-data-message="No allowed URLs have been saved.">
                    </sortable-table>
                </div>
            </div>
            <div class="modal-footer">
                <button ng-show="$ctrl.cms.chatModerationData.urlAllowlist.length > 0" type="button" class="btn btn-danger pull-left" ng-click="$ctrl.deleteAllWords()">Delete All Allowed URLs</button>
            </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(chatModerationService, utilityService, logger) {
                let $ctrl = this;

                $ctrl.search = "";

                $ctrl.cms = chatModerationService;

                $ctrl.$onInit = function() {
                // When the compontent is initialized
                // This is where you can start to access bindings, such as variables stored in 'resolve'
                // IE $ctrl.resolve.shouldDelete or whatever
                };

                $ctrl.wordHeaders = [
                    {
                        name: "TEXT",
                        icon: "fa-quote-right",
                        dataField: "text",
                        headerStyles: {
                            'width': '375px'
                        },
                        sortable: true,
                        cellTemplate: `{{data.text}}`,
                        cellController: () => {}
                    },
                    {
                        name: "CREATED AT",
                        icon: "fa-calendar",
                        dataField: "createdAt",
                        sortable: true,
                        cellTemplate: `{{data.createdAt | prettyDate}}`,
                        cellController: () => {}
                    },
                    {
                        headerStyles: {
                            'width': '15px'
                        },
                        cellStyles: {
                            'width': '15px'
                        },
                        sortable: false,
                        cellTemplate: `<i class="fal fa-trash-alt clickable" style="color:#ff3737;" ng-click="clicked()" uib-tooltip="Delete" tooltip-append-to-body="true"></i>`,
                        cellController: ($scope, chatModerationService) => {
                            $scope.clicked = () => {
                                chatModerationService.removeAllowedUrlByText($scope.data.text);
                            };
                        }
                    }
                ];

                $ctrl.addWord = () => {
                    utilityService.openGetInputModal(
                        {
                            model: "",
                            label: "Add allowed URL",
                            saveText: "Add",
                            inputPlaceholder: "Enter allowed URL",
                            validationFn: (value) => {
                                return new Promise(resolve => {
                                    if (value == null || value.trim().length < 1 || value.trim().length > 359) {
                                        resolve(false);
                                    } else if (chatModerationService.chatModerationData.urlAllowlist
                                        .some(u => u.text === value.toLowerCase())) {
                                        resolve(false);
                                    } else {
                                        resolve(true);
                                    }
                                });
                            },
                            validationText: "Allowed URL can't be empty and can't already exist."

                        },
                        (newWord) => {
                            chatModerationService.addAllowedUrls([newWord.trim()]);
                        });
                };

                $ctrl.showImportModal = () => {
                    utilityService.showModal({
                        component: "txtFileWordImportModal",
                        size: 'sm',
                        resolveObj: {},
                        closeCallback: data => {
                            let filePath = data.filePath,
                                delimiter = data.delimiter;

                            let contents;
                            try {
                                contents = fs.readFileSync(filePath, "utf8");
                            } catch (err) {
                                logger.error("error reading file for allowed URLs", err);
                                return;
                            }

                            let words = [];
                            if (delimiter === 'newline') {
                                words = contents.replace(/\r\n/g, "\n").split("\n");
                            } else if (delimiter === "comma") {
                                words = contents.split(",");
                            } else if (delimiter === "space") {
                                words = contents.split(" ");
                            }

                            if (words != null) {
                                chatModerationService.addAllowedUrls(words);
                            }
                        }
                    });
                };

                $ctrl.deleteAllWords = function() {
                    utilityService.showConfirmationModal({
                        title: "Delete All Allowed URLs",
                        question: `Are you sure you want to delete all allowed URLs?`,
                        confirmLabel: "Delete",
                        confirmBtnType: "btn-danger"
                    }).then(confirmed => {
                        if (confirmed) {
                            chatModerationService.removeAllAllowedUrls();
                        }
                    });
                };
            }
        });
}());
