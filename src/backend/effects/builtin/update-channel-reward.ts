import { EffectType } from "../../../types/effects";
import { EffectCategory } from '../../../shared/effect-constants';
import channelRewardsManager from "../../channel-rewards/channel-reward-manager";
import logger from "../../logwrapper";
import {SavedChannelReward} from "../../../types/channel-rewards";

type StringUpdatable = { update: boolean, newValue: string };
type StatusUpdatable = { update: boolean, newValue: 'toggle' | boolean };

type RewardWithTags = SavedChannelReward & { sortTags: string[] };

type EffectMeta = {
    rewardSettings: {
        name: StringUpdatable;
        description: StringUpdatable;
        cost: StringUpdatable;
        enabled: StatusUpdatable;
        paused: StatusUpdatable;
    };
    channelRewardId: string;
    useTag?: boolean;
    sortTagId?: string;
}

function updateRewardEnabledOrPaused(effect: EffectMeta, channelReward: SavedChannelReward) {
    if (effect.rewardSettings.enabled.update) {
        channelReward.twitchData.isEnabled = effect.rewardSettings.enabled.newValue === 'toggle' ?
            !channelReward.twitchData.isEnabled :
            effect.rewardSettings.enabled.newValue === true;
    }
    if (effect.rewardSettings.paused.update) {
        channelReward.twitchData.isPaused = effect.rewardSettings.paused.newValue === 'toggle' ?
            !channelReward.twitchData.isPaused :
            effect.rewardSettings.paused.newValue === true;
    }
}

const model: EffectType<EffectMeta> = {
    definition: {
        id: "firebot:update-channel-reward",
        name: "Update Channel Reward",
        description: "Update settings for a channel reward",
        icon: "fad fa-gifts",
        categories: [EffectCategory.ADVANCED, EffectCategory.TWITCH],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container ng-hide="!hasTags">
            <label class="control-fb control--checkbox"> Use Sort Tags</tooltip>
                <input type="checkbox" ng-model="effect.useTag">
                <div class="control__indicator"></div>
            </label>
        </eos-container>


        <eos-container ng-hide="effect.useTag" header="Channel Reward">
            <ui-select ng-model="effect.channelRewardId" theme="bootstrap">
                <ui-select-match placeholder="Select or search for a channel reward... ">{{$select.selected.name}}</ui-select-match>
                <ui-select-choices repeat="reward.id as reward in manageableRewards | filter: { name: $select.search }" style="position:relative;">
                    <div ng-bind-html="reward.name | highlight: $select.search"></div>
                </ui-select-choices>
            </ui-select>
        </eos-container>

        <eos-container ng-show="effect.useTag" header="Channel Reward Tags">
            <ui-select ng-model="effect.sortTagId" theme="bootstrap">
                <ui-select-match placeholder="Select or search for a tag... ">{{$select.selected.name}}</ui-select-match>
                <ui-select-choices repeat="sortTag.id as sortTag in sortTags | filter: { name: $select.search }" style="position:relative;">
                    <div ng-bind-html="sortTag.name | highlight: $select.search"></div>
                </ui-select-choices>
            </ui-select>
        </eos-container>

        <eos-container ng-show="effect.channelRewardId != null || (effect.useTag && effect.sortTagId != null)" header="Reward Settings" pad-top="true">

            <label class="control-fb control--checkbox">Update Enabled
                <input type="checkbox" ng-click="effect.rewardSettings.enabled.update = !effect.rewardSettings.enabled.update" ng-checked="effect.rewardSettings.enabled.update"  aria-label="Toggle enabled" >
                <div class="control__indicator"></div>
            </label>
            <div ng-show="effect.rewardSettings.enabled.update" style="margin-bottom: 15px;">
                <div class="btn-group" uib-dropdown>
                    <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
                    {{getToggleEnabledDisplay(effect.rewardSettings.enabled.newValue)}} <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                        <li role="menuitem" ng-click="effect.rewardSettings.enabled.newValue = true"><a href>Enable</a></li>
                        <li role="menuitem" ng-click="effect.rewardSettings.enabled.newValue = false"><a href>Disable</a></li>
                        <li role="menuitem" ng-click="effect.rewardSettings.enabled.newValue = 'toggle'"><a href>Toggle</a></li>
                    </ul>
                </div>
            </div>

            <label class="control-fb control--checkbox">Update Paused
                <input type="checkbox" ng-click="effect.rewardSettings.paused.update = !effect.rewardSettings.paused.update" ng-checked="effect.rewardSettings.paused.update"  aria-label="Toggle paused" >
                <div class="control__indicator"></div>
            </label>
            <div ng-show="effect.rewardSettings.paused.update" style="margin-bottom: 15px;">
                <div class="btn-group" uib-dropdown>
                    <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
                    {{getTogglePausedDisplay(effect.rewardSettings.paused.newValue)}} <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                        <li role="menuitem" ng-click="effect.rewardSettings.paused.newValue = true"><a href>Paused</a></li>
                        <li role="menuitem" ng-click="effect.rewardSettings.paused.newValue = false"><a href>Unpaused</a></li>
                        <li role="menuitem" ng-click="effect.rewardSettings.paused.newValue = 'toggle'"><a href>Toggle</a></li>
                    </ul>
                </div>
            </div>

            <div ng-hide="effect.useTag">
                <label class="control-fb control--checkbox">Update Name
                    <input
                        type="checkbox"
                        ng-click="effect.rewardSettings.name.update = !effect.rewardSettings.name.update"
                        ng-checked="effect.rewardSettings.name.update"
                        aria-label="Update name"
                    />
                    <div class="control__indicator"></div>
                </label>
                <div ng-show="effect.rewardSettings.name.update" style="margin-bottom: 15px;">
                    <firebot-input model="effect.rewardSettings.name.newValue" placeholder-text="Enter text" />
                </div>

                <label class="control-fb control--checkbox">Update Description
                    <input
                        type="checkbox"
                        ng-click="effect.rewardSettings.description.update = !effect.rewardSettings.description.update"
                        ng-checked="effect.rewardSettings.description.update"
                        aria-label="Update description"
                    />
                    <div class="control__indicator"></div>
                </label>
                <div ng-show="effect.rewardSettings.description.update" style="margin-bottom: 15px;">
                    <firebot-input model="effect.rewardSettings.description.newValue" use-text-area="true" placeholder-text="Enter text" />
                </div>

                <label class="control-fb control--checkbox">Update Cost
                    <input
                        type="checkbox"
                        ng-click="effect.rewardSettings.cost.update = !effect.rewardSettings.cost.update"
                        ng-checked="effect.rewardSettings.cost.update"
                        aria-label="Update cost"
                    />
                    <div class="control__indicator"></div>
                </label>
                <div ng-show="effect.rewardSettings.cost.update" style="margin-bottom: 15px;">
                    <firebot-input model="effect.rewardSettings.cost.newValue" placeholder-text="Enter new cost" />
                </div>
            </div>

        </eos-container>
    `,
    optionsController: ($scope, channelRewardsService, sortTagsService) => {

        $scope.manageableRewards = channelRewardsService
            .channelRewards.filter(r => r.manageable)
            .map(r => ({ id: r.twitchData.id, name: r.twitchData.title }));

        $scope.sortTags = sortTagsService.getSortTags('channel rewards');

        $scope.hasTags = $scope.sortTags != null && $scope.sortTags.length > 0;

        $scope.getToggleEnabledDisplay = (action) => {
            if (action === "toggle") {
                return "Toggle";
            }
            if (action === true) {
                return "Enable";
            }
            return "Disable";
        };

        $scope.getTogglePausedDisplay = (action) => {
            if (action === "toggle") {
                return "Toggle";
            }
            if (action === true) {
                return "Pause";
            }
            return "Unpause";
        };

        if ($scope.effect.rewardSettings == null) {
            $scope.effect.rewardSettings = {
                name: {
                    update: false,
                    newValue: ""
                },
                description: {
                    update: false,
                    newValue: ""
                },
                cost: {
                    update: false,
                    newValue: "1"
                },
                enabled: {
                    update: false,
                    newValue: 'toggle'
                },
                paused: {
                    update: false,
                    newValue: 'toggle'
                }
            };
        }
    },
    optionsValidator: (effect) => {
        const errors = [];
        if (!effect.useTag && effect.channelRewardId == null) {
            errors.push("Please select a channel reward to update.");
        } else if (effect.useTag &&
            !effect.rewardSettings.paused.update &&
            !effect.rewardSettings.enabled.update) {
            errors.push("Please select a channel reward tag to update.");
        } else if ((!effect.useTag &&
            !effect.rewardSettings.paused.update &&
            !effect.rewardSettings.enabled.update &&
            !effect.rewardSettings.cost.update &&
            !effect.rewardSettings.name.update &&
            !effect.rewardSettings.description.update) ||
            (effect.useTag &&
            !effect.rewardSettings.paused.update &&
            !effect.rewardSettings.enabled.update)) {
            errors.push("Please select at least one property to update.");
        } else if (effect.rewardSettings.name.update &&
            (effect.rewardSettings.name.newValue == null ||
                effect.rewardSettings.name.newValue === "")) {
            errors.push("Please provide a new name for the reward.");
        } else if (effect.rewardSettings.description.update &&
            (effect.rewardSettings.description.newValue == null ||
                effect.rewardSettings.description.newValue === "")) {
            errors.push("Please provide a new description for the reward.");
        } else if (effect.rewardSettings.cost.update &&
            !effect.rewardSettings.cost.newValue?.length) {
            errors.push("Please provide a new cost for the reward.");
        }

        return errors;
    },
    onTriggerEvent: async ({ effect }) => {
        if (!effect.rewardSettings.paused.update &&
            !effect.rewardSettings.enabled.update &&
            !effect.rewardSettings.cost.update &&
            !effect.rewardSettings.name.update &&
            !effect.rewardSettings.description.update) {
            logger.error("Update Channel Reward: No updates selected. Skipping effect.");
            return false;
        }
        if (!effect.useTag) {
            if (effect.rewardSettings.name.update && (effect.rewardSettings.name.newValue == null ||
                effect.rewardSettings.name.newValue === "" ||
                effect.rewardSettings.name.newValue.length > 45)) {
                logger.error("Update Channel Reward: Invalid Name.");
                return;
            }

            if (effect.rewardSettings.description.update && (effect.rewardSettings.description.newValue == null ||
                effect.rewardSettings.description.newValue === "" ||
                effect.rewardSettings.description.newValue.length > 200)) {
                logger.error("Update Channel Reward: Invalid Description.");
                return;
            }

            if (effect.rewardSettings.cost.update && (effect.rewardSettings.cost.newValue == null ||
                isNaN(parseInt(effect.rewardSettings.cost.newValue)) ||
                parseInt(effect.rewardSettings.cost.newValue) < 1)) {
                logger.error("Update Channel Reward: Invalid Cost.");
                return;
            }

            const channelReward = channelRewardsManager.getChannelReward(effect.channelRewardId);

            if (channelReward == null) {
                return;
            }

            if (effect.rewardSettings.name.update) {
                channelReward.twitchData.title = effect.rewardSettings.name.newValue;
            }
            if (effect.rewardSettings.description.update) {
                channelReward.twitchData.prompt = effect.rewardSettings.description.newValue;
            }
            if (effect.rewardSettings.cost.update) {
                channelReward.twitchData.cost = parseInt(effect.rewardSettings.cost.newValue);
            }
            updateRewardEnabledOrPaused(effect, channelReward);
            await channelRewardsManager.saveChannelReward(channelReward, true);
            return true;
        }

        if (!effect.rewardSettings.enabled.update && !effect.rewardSettings.paused.update) {
            logger.error("Update Channel Reward: Trying to toggle by tag without updating enabled or paused. Skipping.");
            return false;
        }

        const rewards = Object.values(channelRewardsManager.channelRewards as Record<string, RewardWithTags>)
            .filter(reward => reward.sortTags?.includes(effect.sortTagId) && reward.manageable);

        const promises: Promise<SavedChannelReward>[] = [];

        rewards.forEach((channelReward) => {
            updateRewardEnabledOrPaused(effect, channelReward);
            promises.push(channelRewardsManager.saveChannelReward(channelReward, true));
        });

        await Promise.all(promises);
    }
};

export = model;