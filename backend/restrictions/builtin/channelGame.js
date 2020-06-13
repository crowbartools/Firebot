"use strict";

const channelAccess = require("../../common/channel-access");
const mixerApi = require("../../mixer-api/api");

const model = {
    definition: {
        id: "firebot:channelGame",
        name: "Channel Game",
        description: "Restricts use to when the game is a specific game.",
        triggers: []
    },
    optionsTemplate: `
    <div>
        <ui-select ng-model="selectedGame" theme="bootstrap" spinner-enabled="true" on-select="gameSelected($item)" style="margin-bottom:10px;">
            <ui-select-match placeholder="Search for game">
                <div style="height: 21px; display:flex; flex-direction: row; align-items: center;">
                    <img style="height: 21px; width: 21px; border-radius: 5px; margin-right:5px;" ng-src="{{$select.selected.coverUrl}}">
                    <div style="font-weight: 100;font-size: 17px;">{{$select.selected.name}}</div>
                </div>
            </ui-select-match>
            <ui-select-choices minimum-input-length="1" repeat="game in games | filter: $select.search" refresh="searchGames($select.search)" refresh-delay="400" style="position:relative;">
                <div style="height: 35px; display:flex; flex-direction: row; align-items: center;">
                    <img style="height: 30px; width: 30px; border-radius: 5px; margin-right:10px;" ng-src="{{game.coverUrl}}">
                    <div style="font-weight: 100;font-size: 17px;">{{game.name}}</div>
                </div>                                  
            </ui-select-choices>
        </ui-select>
    </div>
    `,
    optionsController: ($scope, $http) => {
        let restriction = $scope.restriction;

        $scope.games = [];
        $scope.searchGames = function(gameQuery) {
            return $http.get('https://mixer.com/api/v1/types', {
                params: {
                    query: gameQuery
                }
            }).then(function(response) {
                $scope.games = response.data;
            });
        };

        if (restriction.gameId != null) {
            $http.get(`https://mixer.com/api/v1/types/${restriction.gameId}`)
                .then(function(response) {
                    $scope.selectedGame = response.data;
                });
        }

        $scope.gameSelected = function(game) {
            if (game != null) {
                restriction.gameId = game.id;
            }
        };
    },
    optionsValueDisplay: (restriction, $http) => {
        return new Promise(resolve => {
            if (restriction.gameId != null) {
                $http.get(`https://mixer.com/api/v1/types/${restriction.gameId}`)
                    .then(function(response) {
                        resolve(response.data.name);
                    });
            } else {
                resolve('[Game Not Set]');
            }
        });
    },
    /*
      function that resolves/rejects a promise based on if the restriction critera is met
    */
    predicate: (triggerData, restrictionData) => {
        return new Promise(async (resolve, reject) => {

            const expectedGameId = restrictionData.gameId;
            if (expectedGameId == null) {
                return resolve();
            }

            const channelGame = await channelAccess.getStreamerGameData();
            if (channelGame == null) {
                return reject(`Can't determine the game being played.`);
            }

            const currentGameId = channelGame.id;

            let passed = false;

            if (expectedGameId === currentGameId) {
                passed = true;
            }

            if (passed) {
                resolve();
            } else {
                const typeInfo = await mixerApi.types.getChannelType(expectedGameId);
                reject(`Channel game isn't '${typeInfo ? typeInfo.name : 'correct'}'.`);
            }
        });
    },
    onSuccessful: (triggerData, restrictionData) => {

    }

};

module.exports = model;