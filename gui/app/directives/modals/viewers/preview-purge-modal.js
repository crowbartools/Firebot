"use strict";

(function() {

    angular.module("firebotApp")
        .component("previewPurgeModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Purge Preview</h4>
            </div>
            <div class="modal-body">
                <div style="margin: 0 0 25px;display: flex;flex-direction: row;justify-content: space-between;">
                    <div style="display: flex;flex-direction: row;justify-content: space-between;">
                        <searchbar placeholder-text="Search users..." query="$ctrl.search" style="flex-basis: 250px;"></searchbar>
                    </div>
                </div>
                <sortable-table
                    table-data-set="$ctrl.viewers"
                    headers="$ctrl.headers"
                    query="$ctrl.search"
                    clickable="false"
                    track-by-field="_id"
                    starting-sort-field="username"
                    no-data-message="No viewers met purge criteria">
                </sortable-table>
            </div>
            <div class="modal-footer" style="text-align:center;">
                <button type="button" class="btn btn-primary" ng-click="$ctrl.close()">Back</button>
            </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function() {
                const $ctrl = this;

                $ctrl.search = "";

                $ctrl.viewers = [];

                $ctrl.$onInit = function() {
                    if ($ctrl.resolve.viewers) {
                        $ctrl.viewers = $ctrl.resolve.viewers;
                    }
                };

                $ctrl.headers = [
                    {
                        name: "USERNAME",
                        icon: "fa-user",
                        dataField: "username",
                        headerStyles: {
                            'min-width': '125px'
                        },
                        sortable: true,
                        cellTemplate: `{{data.displayName || data.username}}`,
                        cellController: () => {}
                    },
                    {
                        name: "LAST SEEN",
                        icon: "fa-eye",
                        dataField: "lastSeen",
                        sortable: true,
                        cellTemplate: `{{data.lastSeen | prettyDate}}`,
                        cellController: () => {}
                    },
                    {
                        name: "VIEW TIME (hours)",
                        icon: "fa-tv",
                        dataField: "minutesInChannel",
                        sortable: true,
                        cellTemplate: `{{getViewTimeDisplay(data.minutesInChannel)}}`,
                        cellController: ($scope) => {
                            $scope.getViewTimeDisplay = (minutesInChannel) => {
                                return minutesInChannel < 60 ? 'Less than an hour' : Math.round(minutesInChannel / 60);
                            };
                        }
                    },
                    {
                        name: "CHAT MESSAGES",
                        icon: "fa-comments",
                        dataField: "chatMessages",
                        sortable: true,
                        cellTemplate: `{{data.chatMessages}}`,
                        cellController: () => {}
                    }
                ];
            }
        });
}());
