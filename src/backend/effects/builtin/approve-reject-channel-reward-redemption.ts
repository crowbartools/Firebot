import { EffectType } from "../models/effect-models";
import { EffectCategory } from "../../../shared/effect-constants";
import twitchApi from "../../twitch-api/api";

const model: EffectType<{
    rewardId: string;
    redemptionId: string;
    approve: boolean;
}>  = {
    definition: {
        id: "firebot:approve-reject-channel-reward-redemption",
        name: "Approve/Reject Channel Reward Redemption",
        description: "Approves or rejects a pending Twitch channel reward redemption",
        icon: "fad fa-check-circle",
        categories: [ EffectCategory.COMMON, EffectCategory.TWITCH ],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container header="Reward Info">
            <firebot-input input-title="Reward ID" model="effect.rewardId" placeholder-text="Enter reward ID" />
        </eos-container>

        <eos-container header="Redemption Info" pad-top="true">
            <firebot-input input-title="Redemption ID" model="effect.redemptionId" placeholder-text="Enter redemption ID" />
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

        if (!effect.rewardId?.length) {
            errors.push("You must enter a reward ID");
        } else if (!effect.redemptionId?.length) {
            errors.push("You must enter a redemption ID");
        } else if (effect.approve == null) {
            errors.push("You must select an action");
        }

        return errors;
    },
    optionsController: () => {
        
    },
    onTriggerEvent: async ({ effect }) => {
        return await twitchApi.channelRewards.approveOrRejectChannelRewardRedemption(
            effect.rewardId,
            effect.redemptionId,
            effect.approve
        );
    }
}

module.exports = model;