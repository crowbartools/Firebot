"use strict";

// Basic template for a modal component, copy this and rename to build a modal.

(function() {

    const fs = require("fs");

    angular.module("firebotApp")
        .component("editBannedWordsModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Edit Banned Words</h4>
            </div>
            <div class="modal-body">
                <p class="muted" style="margin-bottom:20px;">Messages containing any words or phrases listed here will be automatically deleted.</p>
                <div style="margin: 0 0 25px;display: flex;flex-direction: row;justify-content: space-between;">

                    <div class="dropdown">
                        <button class="btn btn-primary dropdown-toggle" type="button" id="add-options" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                            <span class="dropdown-text"><i class="far fa-plus-circle"></i> Add Word(s)</span>
                            <span class="caret"></span>
                        </button>
                        <ul class="dropdown-menu" aria-labelledby="add-options">
                            <li role="menuitem" ng-click="$ctrl.addWord()"><a href style="padding-left: 10px;"><i class="fad fa-plus-circle" style="margin-right: 5px;"></i> Add single word</a></li>
                            <li role="menuitem" ng-click="$ctrl.showImportModal()"><a href style="padding-left: 10px;"><i class="fad fa-file-import" style="margin-right: 5px;"></i> Import from .txt file <tooltip text="'Import a list of words/phrases from a txt file'"></tooltip></a></li>
                        </ul>
                    </div>

                    <div style="display: flex;flex-direction: row;justify-content: space-between;">           
                        <searchbar placeholder-text="Search words..." query="$ctrl.search" style="flex-basis: 250px;"></searchbar>
                    </div>         
                </div>
                <sortable-table 
                    table-data-set="$ctrl.cms.chatModerationData.bannedWords"
                    headers="$ctrl.headers"
                    query="$ctrl.search"
                    clickable="false"
                    starting-sort-field="createdAt"
                    sort-initially-reversed="true"
                    page-size="5"
                    no-data-message="No banned words or phrases have been saved.">
                </sortable-table>
            </div>
            <div class="modal-footer">
                <button ng-show="$ctrl.cms.chatModerationData.bannedWords.length > 0" type="button" class="btn btn-danger pull-left" ng-click="$ctrl.deleteAllWords()">Delete All Words</button>
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

                $ctrl.headers = [
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
                                chatModerationService.removeBannedWordByText($scope.data.text);
                            };
                        }
                    }
                ];

                $ctrl.addWord = () => {
                    utilityService.openGetInputModal(
                        {
                            model: "",
                            label: "Add Banned Word",
                            saveText: "Add",
                            inputPlaceholder: "Enter banned word or phrase",
                            validationFn: (value) => {
                                return new Promise(resolve => {
                                    if (value == null || value.trim().length < 1 || value.trim().length > 359) {
                                        resolve(false);
                                    } else if (chatModerationService.chatModerationData.bannedWords
                                        .some(w => w.text === value.toLowerCase())) {
                                        resolve(false);
                                    } else {
                                        resolve(true);
                                    }
                                });
                            },
                            validationText: "Banned word can't be empty and can't already exist."

                        },
                        (newWord) => {
                            chatModerationService.addBannedWords([newWord.trim()]);
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
                                logger.error("error reading file for banned words", err);
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
                                chatModerationService.addBannedWords(words);
                            }
                        }
                    });
                };

                $ctrl.deleteAllWords = function() {
                    utilityService.showConfirmationModal({
                        title: "Delete All Words",
                        question: `Are you sure you want to delete all banned words and phrases?`,
                        confirmLabel: "Delete",
                        confirmBtnType: "btn-danger"
                    }).then(confirmed => {
                        if (confirmed) {
                            chatModerationService.removeAllBannedWords();
                        }
                    });
                };
            }
        });
}());
