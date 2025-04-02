"use strict";

(function() {
    angular.module("firebotApp")
        .component("editStreamInfoModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Edit Stream Info</h4>
                </div>
                <div class="modal-body">

                    <div ng-hide="$ctrl.dataLoaded" style="height: 150px;display: flex;align-items: center;justify-content: center;">
                        <div class="bubble-spinner">
                            <div class="bounce1"></div>
                            <div class="bounce2"></div>
                            <div class="bounce3"></div>
                        </div>
                    </div>

                    <form ng-show="$ctrl.dataLoaded" name="streamInfo">
                        <div class="form-group" ng-class="{'has-error': $ctrl.formFieldHasError('title')}">
                            <label for="title" class="control-label">Stream Title</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                required
                                class="form-control input-lg"
                                placeholder="Give your stream a title"
                                ng-model="$ctrl.streamInfo.title"
                            />
                        </div>

                        <div class="form-group">
                            <label for="game" class="control-label">Category</label>
                            <div style="display:flex">
                                <ui-select style="width: 100%" ng-model="$ctrl.selectedGame" required input-id="game" theme="bootstrap" spinner-enabled="true" on-select="$ctrl.gameSelected($item)">
                                    <ui-select-match placeholder="Search for category...">
                                        <div style="height: 25px; display:flex; flex-direction: row; align-items: center;">
                                            <img style="height: 21px; width: 21px; border-radius: 5px; margin-right:5px;" ng-src="{{$select.selected.boxArtUrl}}">
                                            <div style="font-weight: 100;font-size: 17px;">{{$select.selected.name}}</div>
                                        </div>
                                    </ui-select-match>
                                    <ui-select-choices minimum-input-length="1" repeat="game in $ctrl.games | filter: $select.search" refresh="$ctrl.searchGames($select.search)" refresh-delay="200" style="position:relative;">
                                        <div style="height: 35px; display:flex; flex-direction: row; align-items: center;">
                                            <img style="height: 30px; width: 30px; border-radius: 5px; margin-right:10px;" ng-src="{{game.boxArtUrl}}">
                                            <div style="font-weight: 100;font-size: 17px;">{{game.name}}</div>
                                        </div>
                                    </ui-select-choices>
                                </ui-select>
                                <div ng-show="$ctrl.selectedGame != null" style="margin-left: 3px">
                                    <button 
                                        class="btn btn-default"
                                        aria-label="Clear category"
                                        uib-tooltip="Clear category"     
                                        ng-click="$ctrl.removeCategory()">
                                        <i class="far fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="tags" class="control-label">Stream Tags</label>
                            <div style="display: block" role="list">
                                <div class="role-bar" id="tags" ng-repeat="tag in $ctrl.streamInfo.tags" role="listitem">
                                    <span>{{tag}}</span>
                                    <span
                                        role="button"
                                        class="clickable"
                                        style="padding-left: 10px;"
                                        aria-label="Remove {{tag}} tag"
                                        uib-tooltip="Remove tag"
                                        tooltip-append-to-body="true"
                                        ng-click="$ctrl.removeStreamTag(tag)"
                                    >
                                        <i class="far fa-times"></i>
                                    </span>
                                </div>
                                <div
                                    class="role-bar clickable"
                                    ng-show="$ctrl.streamInfo.tags.length < 10"
                                    role="button"
                                    aria-label="Add tag"
                                    uib-tooltip="Add tag"
                                    tooltip-append-to-body="true"
                                    ng-click="$ctrl.openAddStreamTagsModal()"
                                >
                                    <i class="far fa-plus"></i>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" ng-click="$ctrl.dismiss()">Cancel</button>
                    <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function($scope, ngToast, utilityService, backendCommunicator) {
                const $ctrl = this;

                $ctrl.dataLoaded = false;

                $ctrl.games = [];

                $ctrl.originalGame = {
                    id: 0,
                    name: ""
                };

                $ctrl.streamInfo = {
                    title: "",
                    gameId: 0,
                    gameName: "",
                    tags: []
                };

                $ctrl.selectedGame = null;

                $ctrl.formFieldHasError = (fieldName) => {
                    return ($scope.streamInfo.$submitted || $scope.streamInfo[fieldName].$touched)
                        && $scope.streamInfo[fieldName].$invalid;
                };

                $ctrl.$onInit = async () => {
                    $ctrl.streamInfo = await backendCommunicator.fireEventAsync("get-channel-info");

                    if ($ctrl.streamInfo) {
                        if ($ctrl.streamInfo.gameId) {
                            const game = await backendCommunicator.fireEventAsync("get-twitch-game", $ctrl.streamInfo.gameId);

                            if (game != null) {
                                $ctrl.originalGame = {
                                    id: game.id,
                                    name: game.name
                                };
                                $ctrl.selectedGame = game;
                            }
                        }

                        $ctrl.dataLoaded = true;
                    }
                };

                $ctrl.openAddStreamTagsModal = function() {
                    utilityService.openGetInputModal(
                        {
                            label: "Add Stream Tag",
                            saveText: "Add",
                            inputPlaceholder: "Enter a tag",
                            validationFn: (value) => {
                                return new Promise((resolve) => {
                                    // Must be alphanumeric no more than 25 characters
                                    const tagRegExp = /^[a-z0-9]{1,25}$/ig;

                                    if (value == null || value.trim().length < 1) {
                                        resolve(false);
                                    } else if (!tagRegExp.test(value)) {
                                        resolve(false);
                                    } else if ($ctrl.streamInfo.tags.findIndex(element => value.toLowerCase() === element.toLowerCase()) !== -1) {
                                        resolve(false);
                                    } else {
                                        resolve(true);
                                    }
                                });
                            },
                            validationText: "Tag name cannot be empty, must contain a maximum of 25 alphanumeric characters, cannot contain spaces, and must be unique."
                        },
                        (tag) => {
                            $ctrl.streamInfo.tags.push(tag);
                        });
                };

                $ctrl.searchGames = function(gameQuery) {
                    backendCommunicator.fireEventAsync("search-twitch-games", gameQuery)
                        .then((games) => {
                            if (games != null) {
                                $ctrl.games = games;
                            }
                        });
                };

                $ctrl.gameSelected = function(game) {
                    if (game != null) {
                        $ctrl.streamInfo.gameId = game.id;
                        $ctrl.streamInfo.gameName = game.name;
                    }
                };

                $ctrl.removeCategory = function() {
                    $ctrl.selectedGame = null;
                    $ctrl.streamInfo.gameId = '';
                    $ctrl.streamInfo.gameName = null;
                };

                $ctrl.removeStreamTag = function(tag) {
                    $ctrl.streamInfo.tags = $ctrl.streamInfo.tags.filter(element => tag.toLowerCase() !== element.toLowerCase());
                };

                $ctrl.save = async () => {
                    await backendCommunicator.fireEventAsync("set-channel-info", $ctrl.streamInfo);
                    if ($ctrl.streamInfo.gameId !== $ctrl.originalGame.id) {
                        backendCommunicator.fireEvent("category-changed", $ctrl.streamInfo.gameName);
                    }
                    ngToast.create({
                        className: 'success',
                        content: "Updated stream info!"
                    });
                    $ctrl.dismiss();
                };
            }
        });
}());
