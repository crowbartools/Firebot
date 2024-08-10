import { EffectType } from "../../../../types/effects";
import { EffectCategory } from "../../../../shared/effect-constants";
import channelRewardManager from "../../../channel-rewards/channel-reward-manager";

const model: EffectType<{
    rewardMode?: "custom" | "current";
    rewardId?: string;
    redemptionMode?: "custom" | "current";
    redemptionId?: string;
    approve: boolean;
}> = {
    definition: {
        id: "firebot:approve-reject-channel-reward-redemption",
        name: "Approve/Reject Channel Reward Redemption",
        description: "Approves or rejects a pending Twitch channel reward redemption",
        icon: "fad fa-check-circle",
        categories: [EffectCategory.COMMON, EffectCategory.TWITCH],
        dependencies: {
            twitch: true
        }
    },
    optionsTemplate: `
        <eos-container header="Reward Info">
            <firebot-radio-container>
                <firebot-radio label="Use current reward" model="effect.rewardMode" value="'current'" tooltip="Uses the reward that triggered this effect" />
                <firebot-radio label="Custom" model="effect.rewardMode" value="'custom'" />
                <firebot-input ng-if="effect.rewardMode === 'custom'" input-title="Reward ID" model="effect.rewardId" placeholder-text="Enter reward ID" menu-position="below" />
            </firebot-radio-container>
        </eos-container>

        <eos-container header="Redemption Info" pad-top="true">
            <firebot-radio label="Use current redemption" model="effect.redemptionMode" value="'current'" tooltip="Uses the reward that triggered this effect" />
            <firebot-radio label="Custom" model="effect.redemptionMode" value="'custom'" />
            <firebot-input ng-if="effect.redemptionMode === 'custom'" input-title="Redemption ID" model="effect.redemptionId" placeholder-text="Enter redemption ID" />
        </eos-container>

        <eos-container header="Action" pad-top="true">
            <div class="btn-group">
                <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <span class="list-effect-type">{{effect.approve != null ? (effect.approve === true ? 'Approve' : 'Reject') : 'Pick One'}}</span> <span class="caret"></span>
                </button>
                <ul class="dropdown-menu">
                    <li ng-click="effect.approve = true">
                        <a href>Approve</a>
                    </li>
                    <li ng-click="effect.approve = false">
                        <a href>Reject</a>
                    </li>
                </ul>
            </div>
        </eos-container>

        <eos-container>
            <div class="effect-info alert alert-warning">
                Note: You may only approve/reject channel reward redemptions created in Firebot.
            </div>
        </eos-container>
    `,
    optionsValidator: (effect) => {
        const errors: string[] = [];

        const rewardMode = effect.rewardMode ?? "custom";
        const redemptionMode = effect.redemptionMode ?? "custom";

        if (rewardMode === "custom" && !effect.rewardId?.length) {
            errors.push("You must enter a reward ID");
        } else if (redemptionMode === "custom" && !effect.redemptionId?.length) {
            errors.push("You must enter a redemption ID");
        } else if (effect.approve == null) {
            errors.push("You must select an action");
        }

        return errors;
    },
    optionsController: ($scope) => {
        if ($scope.effect.rewardMode == null) {
            $scope.effect.rewardMode = "custom";
        }
        if ($scope.effect.redemptionMode == null) {
            $scope.effect.redemptionMode = "custom";
        }
    },
    onTriggerEvent: async ({ effect, trigger }) => {

        const rewardMode = effect.rewardMode ?? "custom";
        const redemptionMode = effect.redemptionMode ?? "custom";

        const rewardId = (rewardMode === "custom" ?
            effect.rewardId :
            trigger.metadata.eventData ?
                trigger.metadata.eventData.rewardId :
                trigger.metadata.rewardId) as string;

        const redemptionId = (redemptionMode === "custom" ?
            effect.redemptionId :
            trigger.metadata.eventData ?
                trigger.metadata.eventData.redemptionId :
                trigger.metadata.redemptionId) as string;

        if (!rewardId || !redemptionId) {
            return;
        }

        return await channelRewardManager.approveOrRejectChannelRewardRedemptions({
            rewardId: rewardId,
            redemptionIds: [redemptionId],
            approve: effect.approve
        });
    }
};

module.exports = model;
