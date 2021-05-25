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

                        <div class="form-group" style="margin-bottom:0;">
                            <label for="game" class="control-label">Game</label>
                            <ui-select ng-model="$ctrl.selectedGame" required input-id="game" theme="bootstrap" spinner-enabled="true" on-select="$ctrl.gameSelected($item)">
                                <ui-select-match placeholder="Search for game...">
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
            controller: function($scope, ngToast, backendCommunicator) {
                const $ctrl = this;

                $ctrl.dataLoaded = false;

                $ctrl.games = [];

                $ctrl.streamInfo = {
                    title: "",
                    gameId: 0
                };

                $ctrl.selectedGame = null;

                $ctrl.formFieldHasError = (fieldName) => {
                    return ($scope.streamInfo.$submitted || $scope.streamInfo[fieldName].$touched)
                        && $scope.streamInfo[fieldName].$invalid;
                };

                $ctrl.$onInit = () => {
                    backendCommunicator.fireEventAsync("get-channel-info")
                        .then((streamInfo) => {
                            if (streamInfo) {
                                $ctrl.streamInfo = streamInfo;
                                backendCommunicator.fireEventAsync("get-twitch-game", $ctrl.streamInfo.gameId)
                                    .then(game => {
                                        if (game != null) {
                                            $ctrl.selectedGame = game;
                                        }
                                        $ctrl.dataLoaded = true;
                                    });
                            }
                        });
                };

                $ctrl.searchGames = function(gameQuery) {
                    backendCommunicator.fireEventAsync("search-twitch-games", gameQuery)
                        .then(games => {
                            if (games != null) {
                                $ctrl.games = games;
                            }
                        });
                };

                $ctrl.gameSelected = function(game) {
                    if (game != null) {
                        $ctrl.streamInfo.gameId = game.id;
                    }
                };

                $ctrl.save = () => {
                    backendCommunicator.fireEventAsync("set-channel-info", $ctrl.streamInfo);
                    ngToast.create({
                        className: 'success',
                        content: "Updated stream info!"
                    });
                    $ctrl.dismiss();
                };
            }
        });
}());
