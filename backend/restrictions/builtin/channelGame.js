"use strict";

const channelAccess = require("../../common/channel-access");

const model = {
    definition: {
        id: "firebot:channelGame",
        name: "Channel Game",
        description: "Restricts use to when the game is a specific game.",
        triggers: []
    },
    optionsTemplate: `
    <div>
    <eos-container header="Mode">
        <div class="controls-fb" style="padding-bottom: 5px;">
            <label class="control-fb control--radio">Specific game  <tooltip text="'Search for a specific game.'"></tooltip>
                <input type="radio" ng-model="restriction.mode" value="specific"/>
                <div class="control__indicator"></div>
            </label>
            <label class="control-fb control--radio">Custom game <tooltip text="'Input any name and Firebot will find the closest game.'"></tooltip>
                <input type="radio" ng-model="restriction.mode" value="custom"/>
                <div class="control__indicator"></div>
            </label>
        </div>
    </eos-container>

    <eos-container header="Specific Game" pad-top="true" ng-if="restriction.mode === 'specific'" >

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

    </eos-container>

    <eos-container header="Custom Game" pad-top="true" ng-if="restriction.mode === 'custom'">
        <input ng-model="restriction.gameName" class="form-control" type="text" placeholder="Enter game name" replace-variables>
    </eos-container>
    </div>
    `,
    optionsController: ($scope, $http) => {
        let restriction = $scope.restriction;
        if (restriction.mode == null) {
            restriction.mode = "specific";
        }

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

        if (restriction.mode === "specific" && restriction.gameId != null) {
            $http.get(`https://mixer.com/api/v1/types/${restriction.gameId}`)
                .then(function(response) {
                    $scope.selectedGame = response.data;
                });
        }

        $scope.gameSelected = function(game) {
            if (game != null) {
                console.log(game);
                restriction.gameId = game.id;
                restriction.gameName = game.name;
            }
        };
    },
    optionsValueDisplay: (restriction) => {
        let gameTitle = restriction.gameName;

        if (gameTitle == null) {
            gameTitle = "";
        }

        return `Game is ${gameTitle}.`;
    },
    /*
      function that resolves/rejects a promise based on if the restriction critera is met
    */
    predicate: (triggerData, restrictionData) => {
        return new Promise(async (resolve, reject) => {
            let channelData = await channelAccess.getStreamerGameData();
            if (channelData == null) {
                reject(`Can't determine the game being played.`);
            }

            let currentGameTitle = channelData.name;
            let gameTitle = restrictionData.gameName;

            let passed = false;

            if (gameTitle.toLowerCase() === currentGameTitle.toLowerCase()) {
                passed = true;
            }

            if (passed) {
                resolve();
            } else {
                reject(`Game must be set to ${gameTitle}.`);
            }
        });
    },
    onSuccessful: (triggerData, restrictionData) => {

    }

};

module.exports = model;