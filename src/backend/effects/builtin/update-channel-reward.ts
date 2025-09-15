import { validate } from "uuid";
import { EffectCategory } from '../../../shared/effect-constants';
import { SavedChannelReward } from "../../../types/channel-rewards";
import { EffectType } from "../../../types/effects";
import channelRewardsManager from "../../channel-rewards/channel-reward-manager";
import logger from "../../logwrapper";

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
    rewardSelectMode: "dropdown" | "associated" | "sortTag" | "custom";
    channelRewardId: string;
    customId: string;
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
        <eos-container>
            <firebot-radios
                options="selectRewardOptions"
                model="effect.rewardSelectMode">
            </firebot-radios>
        </eos-container>

        <eos-container ng-if="effect.rewardSelectMode == 'dropdown'" header="Channel Reward">
            <firebot-searchable-select
                ng-model="effect.channelRewardId"
                items="manageableRewards"
                placeholder="Select or search for a channel reward..."
            />
        </eos-container>

        <eos-container ng-if="effect.rewardSelectMode == 'sortTag'" header="Channel Reward Tags">
            <firebot-searchable-select
                ng-model="effect.sortTagId"
                items="sortTags"
                placeholder="Select or search for a tag..."
            />
        </eos-container>

        <eos-container ng-if="effect.rewardSelectMode == 'custom'" header="Channel Reward Name/ID">
            <firebot-input placeholder="Channel Reward Name/ID" model="effect.customId" menu-position="under" />
        </eos-container>

        <eos-container ng-show="showRewardSettings()" header="Reward Settings" pad-top="true">

            <firebot-checkbox
                label="Update Enabled"
                model="effect.rewardSettings.enabled.update"
                aria-label="Toggle enabled"
            />
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

            <firebot-checkbox
                label="Update Paused"
                model="effect.rewardSettings.paused.update"
                aria-label="Toggle paused"
            />
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

            <div ng-hide="effect.rewardSelectMode === 'sortTag'">
                <firebot-checkbox
                    label="Update Name"
                    model="effect.rewardSettings.name.update"
                    aria-label="Update name"
                />
                <div ng-show="effect.rewardSettings.name.update" style="margin-bottom: 15px;">
                    <firebot-input model="effect.rewardSettings.name.newValue" placeholder-text="Enter text" />
                </div>

                <firebot-checkbox
                    label="Update Description"
                    model="effect.rewardSettings.description.update"
                    aria-label="Update description"
                />
                <div ng-show="effect.rewardSettings.description.update" style="margin-bottom: 15px;">
                    <firebot-input model="effect.rewardSettings.description.newValue" use-text-area="true" placeholder-text="Enter text" />
                </div>

                <firebot-checkbox
                    label="Update Cost"
                    model="effect.rewardSettings.cost.update"
                    aria-label="Update cost"
                />
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

        $scope.sortTags = sortTagsService.getSortTags("channel rewards");

        $scope.hasTags = $scope.sortTags != null && $scope.sortTags.length > 0;

        $scope.selectRewardOptions = {
            dropdown: {
                text: "Select Reward",
                description: "Pick the Channel Reward from a dropdown list"
            },
            associated: {
                text: "Associated Reward",
                description: "Use the Channel Reward associated with the current Event",
                hide: !($scope.trigger === "channel_reward" || $scope.triggerMeta?.triggerId?.startsWith("twitch:channel-reward-redemption"))
            },
            sortTag: {
                text: "Sort Tag",
                description: "Updates Channel Rewards with the specified Sort Tag",
                hide: !$scope.hasTags
            },
            custom: {
                text: "Custom",
                description: "Manually specify a Channel Reward Name/ID"
            }
        };

        if ($scope.effect.rewardSelectMode == null) {
            // Support legacy bool useTag
            $scope.effect.rewardSelectMode = $scope.effect.useTag ? "sortTag" : "dropdown";
        }

        if (!$scope.hasTags && $scope.effect.rewardSelectMode === "sortTag") {
            $scope.effect.rewardSelectMode = "dropdown";
        }

        $scope.showRewardSettings = () => (
            ($scope.effect.rewardSelectMode === "dropdown" && $scope.effect.channelRewardId != null && $scope.effect.channelRewardId !== "") ||
            ($scope.effect.rewardSelectMode === "sortTag" && $scope.effect.sortTagId != null && $scope.effect.sortTagId !== "") ||
            ($scope.effect.rewardSelectMode === "custom" && $scope.effect.customId != null && $scope.effect.customId !== "") ||
            ($scope.effect.rewardSelectMode === "associated")
        );

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

        if (
            effect.rewardSelectMode === null
            || (
                effect.rewardSelectMode === "dropdown" &&
                effect.channelRewardId == null
            ) || (
                effect.rewardSelectMode === "sortTag" &&
                effect.sortTagId == null
            ) || (
                effect.rewardSelectMode === "custom" &&
                effect.customId == null
            )
        ) {
            errors.push("Please specify a channel reward to update.");
        }

        if (
            (
                effect.rewardSelectMode !== "sortTag" &&
                !effect.rewardSettings.paused.update &&
                !effect.rewardSettings.enabled.update &&
                !effect.rewardSettings.cost.update &&
                !effect.rewardSettings.name.update &&
                !effect.rewardSettings.description.update
            ) ||
            (
                effect.rewardSelectMode === "sortTag" &&
                !effect.rewardSettings.paused.update &&
                !effect.rewardSettings.enabled.update
            )
        ) {
            errors.push("Please select at least one property to update.");
        }

        if (effect.rewardSettings.name.update &&
            (effect.rewardSettings.name.newValue == null ||
            effect.rewardSettings.name.newValue === "")
        ) {
            errors.push("Please provide a new name for the reward.");
        }

        if (effect.rewardSettings.description.update &&
            (effect.rewardSettings.description.newValue == null ||
            effect.rewardSettings.description.newValue === "")
        ) {
            errors.push("Please provide a new description for the reward.");
        }

        if (effect.rewardSettings.cost.update &&
            (effect.rewardSettings.cost.newValue == null ||
            effect.rewardSettings.cost.newValue === "")
        ) {
            errors.push("Please provide a new cost for the reward.");
        }

        return errors;
    },
    getDefaultLabel: (effect, channelRewardsService, sortTagsService) => {
        if (!effect.rewardSettings.paused.update &&
            !effect.rewardSettings.enabled.update &&
            !effect.rewardSettings.cost.update &&
            !effect.rewardSettings.name.update &&
            !effect.rewardSettings.description.update) {
            return "";
        }
        // support legacy bool useTag
        let selectMode = effect.rewardSelectMode;
        selectMode ??= effect.useTag ? "sortTag" : "dropdown";

        let rewardName = "";
        let action = "";

        switch (selectMode) {
            case "dropdown":
                rewardName = channelRewardsService.channelRewards.find(r => r.twitchData.id === effect.channelRewardId)?.twitchData.title ?? "Unknown Reward";
                break;
            case "associated":
                rewardName = "Associated Reward";
                break;
            case "sortTag":
                rewardName = `Tag: ${sortTagsService.getSortTags("channel rewards").find(t => t.id === effect.sortTagId)?.name ?? "Unknown Tag"}`;
                break;
            case "custom":
                rewardName = effect.customId;
                break;
        }

        if (effect.rewardSettings.enabled.update && effect.rewardSettings.paused.update) {
            if (effect.rewardSettings.enabled.newValue === "toggle" && effect.rewardSettings.paused.newValue === "toggle") {
                action = "Toggle Enabled & Paused";
            } else {
                const enableAction = effect.rewardSettings.enabled.newValue === "toggle" ? "Toggle Enabled" : effect.rewardSettings.enabled.newValue ? "Enable" : "Disable";
                const pauseAction = effect.rewardSettings.paused.newValue === "toggle" ? "Toggle Paused" : effect.rewardSettings.paused.newValue ? "Pause" : "Unpause";
                action = `${enableAction} & ${pauseAction}`;
            }
        } else if (effect.rewardSettings.enabled.update) {
            action = effect.rewardSettings.enabled.newValue === "toggle" ? "Toggle Enabled" : effect.rewardSettings.enabled.newValue ? "Enable" : "Disable";
        } else if (effect.rewardSettings.paused.update) {
            action = effect.rewardSettings.paused.newValue === "toggle" ? "Toggle Paused" : effect.rewardSettings.paused.newValue ? "Pause" : "Unpause";
        } else if (effect.rewardSettings.name.update) {
            return `Rename ${rewardName} to ${effect.rewardSettings.name.newValue}`;
        } else if (effect.rewardSettings.description.update) {
            action = `Update Description for`;
        } else if (effect.rewardSettings.cost.update) {
            action = `Set Cost to ${effect.rewardSettings.cost.newValue} for`;
        }
        return `${action} ${rewardName}`;
    },
    onTriggerEvent: async ({ trigger, effect }) => {
        if (!effect.rewardSettings.paused.update &&
            !effect.rewardSettings.enabled.update &&
            !effect.rewardSettings.cost.update &&
            !effect.rewardSettings.name.update &&
            !effect.rewardSettings.description.update) {
            logger.error("Update Channel Reward: No updates selected. Skipping effect.");
            return false;
        }
        if (!effect.rewardSelectMode) {
            effect.rewardSelectMode = effect.useTag ? "sortTag" : "dropdown";
        }
        if (effect.rewardSelectMode !== "sortTag") {
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

            let rewardId;
            switch (effect.rewardSelectMode) {
                case "dropdown":
                    rewardId = effect.channelRewardId;
                    break;
                case "associated":
                    rewardId = trigger.metadata.eventData?.rewardId ?? trigger.metadata.rewardId;
                    break;
                case "custom":
                    rewardId = validate(effect.customId)
                        ? effect.customId
                        : channelRewardsManager.getChannelRewardIdByName(effect.customId);
                    break;
            }

            const channelReward = channelRewardsManager.getChannelReward(rewardId);
            if (channelReward == null) {
                logger.error(`Update Channel Reward: Invalid Channel Reward ID: ${rewardId}`);
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