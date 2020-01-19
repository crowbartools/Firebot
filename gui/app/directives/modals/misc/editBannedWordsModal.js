"use strict";

// Basic template for a modal component, copy this and rename to build a modal.

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
                <div style="margin: 0 0 25px;display: flex;flex-direction: row;justify-content: space-between;">
                    <button ng-click="$ctrl.addWord()" class="btn btn-primary"><i class="far fa-plus-circle"></i> Add Word</button>
                    <div style="display: flex;flex-direction: row;justify-content: space-between;">           
                        <searchbar placeholder-text="Search words..." query="$ctrl.search" style="flex-basis: 250px;"></searchbar>
                    </div>         
                </div>
                <sortable-table 
                    table-data-set="$ctrl.cms.chatModerationData.bannedWords"
                    headers="$ctrl.headers"
                    query="$ctrl.search"
                    clickable="false"
                    starting-sort-field="text"
                    no-data-message="No banned words or phrases have been saved.">
                </sortable-table>
            </div>
            <div class="modal-footer"></div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(chatModerationService, utilityService) {
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
                            placeholderText: "Enter banned word/phrase",
                            validationFn: (value) => {
                                return new Promise(resolve => {
                                    if (value == null || value.trim().length < 1) {
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
                            chatModerationService.addBannedWords([newWord]);
                        });
                };
            }
        });
}());
