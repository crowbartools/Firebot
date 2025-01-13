"use strict";

(function() {
    angular.module("firebotApp")
        .component("editBannedWordsModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Edit Banned Words</h4>
            </div>
            <div class="modal-body">
                <p class="muted" style="margin-bottom:20px;">Messages containing any words or phrases listed here will be automatically deleted.</p>
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
                    <div>
                        <button class="btn btn-primary" type="button" id="add-options" ng-click="$ctrl.addRegex()" style="margin-left: 5px;">
                            <span class="dropdown-text"><i class="fas fa-plus-circle"></i> Add regex</span>
                        </button>
                    </div>

                    <div style="display: flex;flex-direction: row;justify-content: space-between;margin-left: auto;">
                        <searchbar placeholder-text="Search words..." query="$ctrl.search" style="flex-basis: 250px;"></searchbar>
                    </div>
                </div>
                <div style="margin-bottom: 10px;">
                    <sortable-table
                        table-data-set="$ctrl.cms.chatModerationData.bannedRegularExpressions"
                        headers="$ctrl.regexHeaders"
                        query="$ctrl.search"
                        clickable="false"
                        starting-sort-field="createdAt"
                        sort-initially-reversed="true"
                        page-size="5"
                        no-data-message="No regular expressions have been saved.">
                    </sortable-table>
                </div>
                <div>
                    <sortable-table
                        table-data-set="$ctrl.cms.chatModerationData.bannedWords"
                        headers="$ctrl.wordHeaders"
                        query="$ctrl.search"
                        clickable="false"
                        starting-sort-field="createdAt"
                        sort-initially-reversed="true"
                        page-size="5"
                        no-data-message="No banned words or phrases have been saved.">
                    </sortable-table>
                </div>
            </div>
            <div class="modal-footer">
                <button ng-show="$ctrl.cms.chatModerationData.bannedWords.length > 0" type="button" class="btn btn-danger pull-left" ng-click="$ctrl.deleteAllWords()">Delete All Words</button>
                <button ng-show="$ctrl.cms.chatModerationData.bannedRegularExpressions.length > 0" type="button" class="btn btn-danger pull-left" ng-click="$ctrl.deleteAllRegex()">Delete All Regex</button>
            </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(chatModerationService, utilityService, logger) {
                const $ctrl = this;

                $ctrl.search = "";

                $ctrl.cms = chatModerationService;

                $ctrl.$onInit = function() {
                // When the compontent is initialized
                // This is where you can start to access bindings, such as variables stored in 'resolve'
                // IE $ctrl.resolve.shouldDelete or whatever
                };

                $ctrl.regexHeaders = [
                    {
                        name: "REGEX",
                        icon: "fa-code",
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
                                chatModerationService.removeRegex($scope.data.text);
                            };
                        }
                    }
                ];

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
                                chatModerationService.removeBannedWordByText($scope.data.text);
                            };
                        }
                    }
                ];

                $ctrl.addRegex = () => {
                    utilityService.openGetInputModal(
                        {
                            model: "",
                            label: "Add Regex",
                            saveText: "Add",
                            inputPlaceholder: "Enter regex",
                            validationFn: (value) => {
                                return new Promise((resolve) => {
                                    if (value == null || value.trim().length < 1) {
                                        return resolve({
                                            success: false,
                                            reason: `Regex value cannot be empty.`
                                        });
                                    }
                                    if (chatModerationService.chatModerationData.bannedRegularExpressions
                                        .some(regex => regex.text === value)) {
                                        return resolve({
                                            success: false,
                                            reason: `Regex already exists.`
                                        });
                                    }
                                    try {
                                        new RegExp(value, "gi");
                                    } catch (error) {
                                        logger.warn(`Invalid RegEx entered: ${value}`, error);
                                        return resolve({
                                            success: false,
                                            reason: `Please enter a valid RegEx.`
                                        });
                                    }
                                    resolve(true);
                                });
                            }
                        },
                        (newRegex) => {
                            chatModerationService.addBannedRegex(newRegex.trim());
                        });
                };

                $ctrl.addWord = () => {
                    utilityService.openGetInputModal(
                        {
                            model: "",
                            label: "Add Banned Word",
                            saveText: "Add",
                            inputPlaceholder: "Enter banned word or phrase",
                            validationFn: (value) => {
                                return new Promise((resolve) => {
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
                        closeCallback: async (data) => {
                            const success = await chatModerationService.importBannedWords(data);

                            if (!success) {
                                utilityService.showErrorModal("There was an error importing the banned word list. Please check the log for more info.");
                            }

                            return success;
                        }
                    });
                };

                $ctrl.deleteAllWords = function() {
                    utilityService.showConfirmationModal({
                        title: "Delete All Words",
                        question: `Are you sure you want to delete all banned words and phrases?`,
                        confirmLabel: "Delete",
                        confirmBtnType: "btn-danger"
                    }).then((confirmed) => {
                        if (confirmed) {
                            chatModerationService.removeAllBannedWords();
                        }
                    });
                };

                $ctrl.deleteAllRegex = function() {
                    utilityService.showConfirmationModal({
                        title: "Delete All Regex",
                        question: `Are you sure you want to delete all regular expressions?`,
                        confirmLabel: "Delete",
                        confirmBtnType: "btn-danger"
                    }).then((confirmed) => {
                        if (confirmed) {
                            chatModerationService.removeAllBannedRegularExpressions();
                        }
                    });
                };
            }
        });
}());