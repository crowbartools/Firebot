"use strict";

const accountAccess = require("../../common/account-access");
const channelAccess = require("../../twitch-api/resource/channels");

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
                    <img style="height: 28px; width: 21px; border-radius: 5px; margin-right:5px;" ng-src="{{$select.selected.box_art_url}}">
                    <div style="font-weight: 100;font-size: 17px;">{{$select.selected.name}}</div>
                </div>
            </ui-select-match>
            <ui-select-choices minimum-input-length="1" repeat="game in games | filter: $select.search" refresh="searchGames($select.search)" refresh-delay="400" style="position:relative;">
                <div style="height: 35px; display:flex; flex-direction: row; align-items: center;">
                    <img style="height: 40px; width: 30px; border-radius: 5px; margin-right:10px;" ng-src="{{game.box_art_url}}">
                    <div style="font-weight: 100;font-size: 17px;">{{game.name}}</div>
                </div>                                  
            </ui-select-choices>
        </ui-select>
    </div>
    `,
    optionsController: ($scope, $q, backendCommunicator) => {
        let restriction = $scope.restriction;

        $scope.games = [];
        $scope.searchGames = function(gameQuery) {
            $q.when(backendCommunicator.fireEventAsync("search-twitch-games", gameQuery))
                .then(game => {
                    if (game != null) {
                        let boxArt = game.box_art_url;
                        boxArt = boxArt.replace("{width}x{height}", "285x380");

                        // eslint-disable-next-line camelcase
                        game.box_art_url = boxArt;
                        $scope.games = [game];
                    }
                });
        };

        $scope.gameSelected = function(game) {
            if (game != null) {
                restriction.gameId = game.id;
                restriction.name = game.name;
            }
        };
    },
    optionsValueDisplay: (restriction, $http) => {
        return new Promise(resolve => {
            if (restriction.name != null) {
                resolve(restriction.name);
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

            const streamerName = accountAccess.getAccounts().streamer.username;
            const channel = await channelAccess.getChannelInformationByUsername(streamerName);

            if (channel == null) {
                return reject(`Can't get channel information.`);
            }

            const currentGameId = channel.gameId;
            if (currentGameId == null) {
                return reject(`Can't determine the game being played.`);
            }

            let passed = false;
            if (expectedGameId === currentGameId) {
                passed = true;
            }

            if (passed) {
                resolve();
            } else {
                reject(`Channel game isn't set to the correct game.`);
            }
        });
    },
    onSuccessful: (triggerData, restrictionData) => {

    }

};

module.exports = model;