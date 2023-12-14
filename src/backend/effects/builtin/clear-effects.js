"use strict";

const webServer = require("../../../server/http-server-manager");
const frontendCommunicator = require("../../common/frontend-communicator");
const effectQueueRunner = require("../../effects/queues/effect-queue-runner");
const { EffectCategory } = require('../../../shared/effect-constants');
const { settings } = require("../../common/settings-access");

/**
 * The Delay effect
 */
const delay = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:clear-effects",
        name: "Clear Effects",
        description: "Remove overlay effects, stop sounds, or clear effect queues",
        icon: "fad fa-minus-circle",
        categories: [EffectCategory.COMMON, EffectCategory.OVERLAY],
        dependencies: []
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
        <eos-container>
            <p>This effect clears currently running effects. Useful, for example, if you are entering a cutscene. You can also use it to purge effect queues.</p>
        </eos-container>
        <eos-container header="Effects To Clear">
            <label class="control-fb control--checkbox"> Overlay Effects
                <input type="checkbox" ng-model="effect.overlay">
                <div class="control__indicator"></div>
            </label>
            <div class="mt-0 mr-0 mb-6 ml-6" uib-collapse="!effect.overlay || !settings.useOverlayInstances()">
                <div class="btn-group">
                    <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <span class="chat-effect-type">{{ getSelectedOverlayDisplay() }}</span> <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu chat-effect-dropdown">
                        <li role="menuitem" ng-click="effect.overlayInstance = null"><a href>Default</a></li>
                        <li role="menuitem" ng-repeat="instanceName in overlayInstances" ng-click="effect.overlayInstance = instanceName"><a href>{{instanceName}}</a></li>
                        <li class="divider"></li>
                        <li role="menuitem" ng-click="effect.overlayInstance = 'all'"><a href>All</a></li>
                    </ul>
                </div>
            </div>
            <label class="control-fb control--checkbox"> Sounds
                <input type="checkbox" ng-model="effect.sounds">
                <div class="control__indicator"></div>
            </label>
            <label class="control-fb control--checkbox"> Effect Queues
                <input type="checkbox" ng-model="effect.queues">
                <div class="control__indicator"></div>
            </label>
            <div uib-collapse="!effect.queues" style="margin: 0 0 15px 15px;">
                <div class="btn-group" uib-dropdown>
                    <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
                    {{ getSelectedEffectQueueDisplay() }} <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                        <li role="menuitem" ng-click="effect.queueId = 'all'"><a href>All</a></li>
                        <li class="divider"></li>
                        <li role="menuitem" ng-repeat="queue in effectQueues" ng-click="effect.queueId = queue.id"><a href>{{queue.name}}</a></li>
                    </ul>
                </div>
            </div>
        </eos-container>
    `,
    /**
   * The controller for the front end Options
   */
    optionsController: ($scope, effectQueuesService, settingsService) => {
        $scope.settings = settingsService;
        $scope.effectQueues = effectQueuesService.getEffectQueues() || [];
        $scope.overlayInstances = settingsService.getOverlayInstances() || [];

        if ($scope.effect.overlayInstance != null && $scope.effect.overlayInstance !== "all") {
            if (!$scope.overlayInstances.includes($scope.effect.overlayInstance)) {
                $scope.effect.overlayInstance = null;
            }
        }

        $scope.getSelectedOverlayDisplay = () => {
            if ($scope.effect.overlayInstance == null) {
                return "Default";
            }

            if ($scope.effect.overlayInstance === "all") {
                return "All";
            }

            const overlayInstance = $scope.overlayInstances.find(oi => oi === $scope.effect.overlayInstance);
            if (overlayInstance) {
                return overlayInstance;
            }
        };

        if ($scope.effect.queueId != null) {
            const queueStillExists = $scope.effectQueues.some(q => q.id === $scope.effect.queueId);
            if (!queueStillExists) {
                $scope.effect.queueId = "all";
            }
        } else {
            $scope.effect.queueId = "all";
        }

        $scope.getSelectedEffectQueueDisplay = () => {
            if (!$scope.effect.queues) {
                return "None";
            }

            if ($scope.effect.queueId === "all") {
                return "All";
            }

            const effectQueue = $scope.effectQueues.find(q => q.id === $scope.effect.queueId);
            if (effectQueue) {
                return effectQueue.name;
            }
            return "None";
        };
    },
    /**
   * When the effect is saved
   */
    optionsValidator: () => {
        const errors = [];
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: async event => {
        const effect = event.effect;

        if (effect.queues) {
            if (effect.queueId === "all") {
                effectQueueRunner.clearAllQueues();
            } else {
                if (effect.queueId) {
                    effectQueueRunner.removeQueue(effect.queueId);
                }
            }
        }

        if (effect.sounds) {
            frontendCommunicator.send("stop-all-sounds");
        }

        if (effect.overlay) {
            if (settings.useOverlayInstances() && effect.overlayInstance != null) {
                if (effect.overlayInstance === "all") {
                    webServer.sendToOverlay("OVERLAY:REFRESH", { global: true });

                    return true;
                }

                webServer.sendToOverlay("OVERLAY:REFRESH", { overlayInstance: effect.overlayInstance });
                return true;
            }

            webServer.sendToOverlay("OVERLAY:REFRESH");
        }

        return true;
    }
};

module.exports = delay;
