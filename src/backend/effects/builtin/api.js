"use strict";

const apiProcessor = require("../../common/handlers/apiProcessor");
const twitchChat = require("../../chat/twitch-chat");
const { EffectCategory, EffectDependency } = require('../../../shared/effect-constants');
/**
 * The API effect
 */
const api = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:api",
        name: "API Effect",
        description: "Pulls info from a pre-selected api.",
        icon: "fad fa-chart-network",
        categories: [EffectCategory.FUN, EffectCategory.CHAT_BASED, EffectCategory.OVERLAY],
        dependencies: [EffectDependency.CHAT],
        outputs: [
            {
                label: "API Response",
                description: "The raw response from the API",
                defaultName: "apiResponse"
            }
        ]
    },
    /**
   * Global settings that will be available in the Settings tab
   */
    globalSettings: {},
    /**
   * The HTML template for the Options view (ie options when effect is added to something such as a button.
   * You can alternatively supply a url to a html file via optionTemplateUrl
   */
    optionsTemplate: `
        <eos-container header="API Type">
            <div class="btn-group">
                <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <span class="api-effect-type">{{effect.api ? effect.api : 'Pick one'}}</span> <span class="caret"></span>
                </button>
                <ul class="dropdown-menu api-effect-dropdown">
                    <li ng-repeat="api in apiTypes"
                        ng-click="effectClick(api)">
                        <a href>{{api.name}}</a>
                    </li>
                </ul>
            </div>
        </eos-container>

        <div ng-if="effect.api != null && effect.api !== 'Pick one'">
            <eos-container  header="Display Location" pad-top="true">
                <div class="controls-fb-inline" style="padding-bottom: 5px;">
                    <label class="control-fb control--radio">Chat
                        <input type="radio" ng-model="effect.show" value="chat"/>
                        <div class="control__indicator"></div>
                    </label>
                    <label class="control-fb control--radio" ng-if="effect.imageAvailable">Overlay
                        <input type="radio" ng-model="effect.show" value="overlay"/>
                        <div class="control__indicator"></div>
                    </label>
                    <label class="control-fb control--radio" ng-if="effect.imageAvailable">Both
                        <input type="radio" ng-model="effect.show" value="both"/>
                        <div class="control__indicator"></div>
                    </label>
                </div>
            </eos-container>
        </div>

        <div ng-if="effect.show === 'chat' || effect.show ==='both'" >
            <eos-chatter-select effect="effect" title="Chat As" pad-top="true"></eos-chatter-select>
        </div>

        <div ng-if="effect.show === 'overlay' && effect.imageAvailable || effect.show ==='both' && effect.imageAvailable">
            <eos-overlay-position effect="effect" pad-top="true"></eos-overlay-position>

            <eos-enter-exit-animations effect="effect" pad-top="true"></eos-enter-exit-animations>

            <eos-container header="Dimensions" pad-top="true">
                <div class="input-group">
                    <span class="input-group-addon">Width</span>
                    <input
                    type="number"
                    class="form-control"
                    aria-describeby="image-width-setting-type"
                    type="number"
                    ng-model="effect.width"
                    placeholder="px">
                    <span class="input-group-addon">Height</span>
                    <input
                    type="number"
                    class="form-control"
                    aria-describeby="image-height-setting-type"
                    type="number"
                    ng-model="effect.height"
                    placeholder="px">
                </div>
            </eos-container>

            <eos-container header="Duration" pad-top="true">
                <div class="input-group">
                    <span class="input-group-addon">Seconds</span>
                    <input
                    type="text"
                    class="form-control"
                    aria-describedby="image-length-effect-type"
                    type="number"
                    ng-model="effect.length">
                </div>
            </eos-container>

            <eos-overlay-instance effect="effect" pad-top="true"></eos-overlay-instance>
        </div>

        <eos-container>
            <div class="effect-info alert alert-danger">
                Warning: These API's pull from a third party and we have no control over the quality or content.
            </div>
        </eos-container>
    `,
    /**
   * The controller for the front end Options
   */
    optionsController: ($scope) => {
        // The name of the api and if it has images available to show or not.
        $scope.apiTypes = [
            { name: "Advice", image: false },
            { name: "Cat Fact", image: false },
            { name: "Dad Joke", image: false },
            { name: "Dog Fact", image: false },
            { name: "Pokemon", image: false },
            { name: "Number Trivia", image: false }
        ];

        // When an api is clicked in the dropdown save its name and if it has images available.
        $scope.effectClick = function (api) {
            $scope.effect.api = api.name;
            $scope.effect.imageAvailable = api.image;
        };
    },
    /**
   * When the effect is triggered by something
   */
    optionsValidator: effect => {
        const errors = [];
        if (effect.api == null) {
            errors.push("Please select an API from the list.");
        }

        if (effect.show == null) {
            errors.push("Please select a places to show the API results.");
        }
        return errors;
    },
    getDefaultLabel: effect => {
        return effect.api;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: async event => {
        const chatter = event.effect.chatter;
        const apiType = event.effect.api;

        const apiResponse = await apiProcessor.getApiResponse(apiType);

        await twitchChat.sendChatMessage(`${apiType}: ${apiResponse}`, null, chatter);

        return {
            success: true,
            outputs: {
                apiResponse: apiResponse
            }
        };
    },
    /**
   * Code to run in the overlay
   */
    overlayExtension: {
        dependencies: {
            css: [],
            js: []
        },
        event: {
            name: "apiEffect",
            onOverlayEvent: () => {
                // The API Effect can sometimes show images in the overlay.
                // As part of this we use the showImage event.
            }
        }
    }
};

module.exports = api;
