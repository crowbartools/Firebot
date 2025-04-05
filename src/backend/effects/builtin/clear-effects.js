"use strict";

const webServer = require("../../../server/http-server-manager");
const frontendCommunicator = require("../../common/frontend-communicator");
const effectQueueRunner = require("../../effects/queues/effect-queue-runner").default;
const { EffectCategory } = require('../../../shared/effect-constants');
const { SettingsManager } = require("../../common/settings-manager");
const { abortAllEffectLists } = require("../../common/effect-abort-helpers");

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
            <firebot-checkbox
                label="Overlay Effects"
                model="effect.overlay"
            />
            <div class="mt-0 mr-0 mb-6 ml-6" uib-collapse="!effect.overlay || !settings.getSetting('UseOverlayInstances')">
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
            <firebot-checkbox
                label="Sounds"
                model="effect.sounds"
            />
            <firebot-checkbox
                label="Effect Queues"
                model="effect.queues"
            />
            <div uib-collapse="!effect.queues" style="margin: 0 0 15px 15px;" class="mb-6">
                <div class="btn-group mb-5" uib-dropdown>
                    <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
                    {{ getSelectedEffectQueueDisplay() }} <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                        <li role="menuitem" ng-click="effect.queueId = 'all'"><a href>All</a></li>
                        <li class="divider"></li>
                        <li role="menuitem" ng-repeat="queue in effectQueues" ng-click="effect.queueId = queue.id"><a href>{{queue.name}}</a></li>
                    </ul>
                </div>
                <firebot-checkbox
                    label="Abort running effect lists for queue(s)"
                    tooltip="Abort any effect lists from the queue(s) that are actively executing effects"
                    model="effect.abortActiveQueueEffectLists"
                />
            </div>
            <firebot-checkbox
                label="All Running Effect Lists"
                tooltip="Abort any effect lists that are actively running effects"
                model="effect.activeEffectLists"
            />
        </eos-container>
    `,
    /**
   * The controller for the front end Options
   */
    optionsController: ($scope, effectQueuesService, settingsService) => {
        $scope.settings = settingsService;
        $scope.effectQueues = effectQueuesService.getEffectQueues() || [];
        $scope.overlayInstances = settingsService.getSetting("OverlayInstances") || [];

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
    onTriggerEvent: async (event) => {
        const effect = event.effect;

        if (effect.queues) {
            if (effect.queueId === "all") {
                effectQueueRunner.clearAllQueues(effect.abortActiveQueueEffectLists);
            } else {
                if (effect.queueId) {
                    effectQueueRunner.removeQueue(effect.queueId, effect.abortActiveQueueEffectLists);
                }
            }
        }

        if (effect.sounds) {
            frontendCommunicator.send("stop-all-sounds");
        }

        if (effect.overlay) {
            if (SettingsManager.getSetting("UseOverlayInstances") && effect.overlayInstance != null) {
                if (effect.overlayInstance === "all") {
                    webServer.sendToOverlay("OVERLAY:REFRESH", { global: true });

                    return true;
                }

                webServer.sendToOverlay("OVERLAY:REFRESH", { overlayInstance: effect.overlayInstance });
                return true;
            }

            webServer.sendToOverlay("OVERLAY:REFRESH");
        }

        if (effect.activeEffectLists) {
            abortAllEffectLists(true);
        }

        return true;
    }
};

module.exports = delay;
