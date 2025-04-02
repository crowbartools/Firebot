import { EffectType } from "../../../../types/effects";
import { EffectCategory } from "../../../../shared/effect-constants";
import logger from "../../../logwrapper";
import twitchApi from "../../../twitch-api/api";
import eventsManager from "../../../events/EventManager";

const model: EffectType<{
    mode: "specific" | "custom" | "clear";
    gameId: string;
    gameName: string;
    specificGameName?: string; // The cached gameName when mode === "specific"
}> = {
    definition: {
        id: "firebot:streamgame",
        name: "Set Stream Category",
        description: "Set the stream category/game.",
        icon: "fad fa-gamepad",
        categories: [EffectCategory.COMMON, EffectCategory.MODERATION, EffectCategory.TWITCH],
        dependencies: {
            twitch: true
        }
    },
    optionsTemplate: `
        <eos-container header="Mode">
            <div class="controls-fb" style="padding-bottom: 5px;">
                <label class="control-fb control--radio">Set specific category  <tooltip text="'Search for a specific category to set.'"></tooltip>
                    <input type="radio" ng-model="effect.mode" value="specific"/>
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio">Custom category <tooltip text="'Input any name and Firebot will set the closest category it finds when effect is ran (useful with replace variables).'"></tooltip>
                    <input type="radio" ng-model="effect.mode" value="custom"/>
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio">Clear category
                    <input type="radio" ng-model="effect.mode" value="clear"/>
                    <div class="control__indicator"></div>
                </label>
            </div>
        </eos-container>

        <eos-container header="Specific Category" pad-top="true" ng-if="effect.mode === 'specific'" >

            <ui-select ng-model="selectedGame" theme="bootstrap" spinner-enabled="true" on-select="gameSelected($item)" style="margin-bottom:10px;">
                <ui-select-match placeholder="Search for category/game">
                    <div style="height: 21px; display:flex; flex-direction: row; align-items: center;">
                        <img style="height: 21px; width: 21px; border-radius: 5px; margin-right:5px;" ng-src="{{$select.selected.boxArtUrl}}">
                        <div style="font-weight: 100;font-size: 17px;">{{$select.selected.name}}</div>
                    </div>
                </ui-select-match>
                <ui-select-choices minimum-input-length="1" repeat="game in games | filter: $select.search" refresh="searchGames($select.search)" refresh-delay="400" style="position:relative;">
                    <div style="height: 35px; display:flex; flex-direction: row; align-items: center;">
                        <img style="height: 30px; width: 30px; border-radius: 5px; margin-right:10px;" ng-src="{{game.boxArtUrl}}">
                        <div style="font-weight: 100;font-size: 17px;">{{game.name}}</div>
                    </div>
                </ui-select-choices>
            </ui-select>

        </eos-container>

        <eos-container header="Custom Category" pad-top="true" ng-if="effect.mode === 'custom'">
            <input ng-model="effect.gameName" class="form-control" type="text" placeholder="Enter category/game name" replace-variables>
        </eos-container>
    `,
    optionsController: ($scope, $q, backendCommunicator) => {
        if ($scope.effect.mode == null) {
            $scope.effect.mode = "specific";
        }
        $scope.games = [];
        $scope.searchGames = function (gameQuery) {
            $q.when(backendCommunicator.fireEventAsync("search-twitch-games", gameQuery)).then((games) => {
                if (games != null) {
                    $scope.games = games;
                }
            });
        };

        if ($scope.effect.mode === "specific" && $scope.effect.gameId != null) {
            $q.when(backendCommunicator.fireEventAsync("get-twitch-game", $scope.effect.gameId)).then((game) => {
                if (game != null) {
                    $scope.selectedGame = game;
                }
            });
        }

        $scope.gameSelected = function (game) {
            if (game != null) {
                $scope.effect.gameId = game.id;
                $scope.effect.specificGameName = game.name;
            }
        };
    },
    optionsValidator: (effect) => {
        const errors = [];
        if (effect.mode === "specific" && (effect.gameId == null || effect.gameId === "")) {
            errors.push("Please search for and select a category/game.");
        } else if (effect.mode === "custom" && effect.gameName == null) {
            errors.push("Please input a title for a category/game.");
        }
        return errors;
    },
    getDefaultLabel: (effect) => {
        if (effect.mode === "custom") {
            return effect.gameName;
        } else if (effect.mode === "clear") {
            return "Clear Category";
        } else if (effect.mode === "specific") {
            return effect.specificGameName ? effect.specificGameName : "Set Specific Category";
        }
        return "";
    },
    onTriggerEvent: async (event) => {
        if (event.effect.mode === "specific") {
            await twitchApi.channels.updateChannelInformation({
                gameId: event.effect.gameId
            });
        } else if (event.effect.mode === "clear" || event.effect.mode === "custom" && !event.effect.gameName) {
            //user left the gamename blank
            await twitchApi.channels.updateChannelInformation({
                gameId: ''
            });
        } else if (event.effect.mode === "custom") {
            const categories = await twitchApi.categories.searchCategories(event.effect.gameName?.trim());
            if (categories?.length) {
                const category =
                    categories.find(c => c.name.toLowerCase() === event.effect.gameName.toLowerCase()) ??
                    categories[0];

                if (!category) {
                    logger.error("Couldn't find a category/game with this name");
                    return;
                }

                await twitchApi.channels.updateChannelInformation({
                    gameId: category.id
                });
            }
        }

        const category = (await twitchApi.channels.getChannelInformation()).gameName;
        eventsManager.triggerEvent("firebot", "category-changed", {
            category: category
        });
        return true;
    }
};

module.exports = model;
