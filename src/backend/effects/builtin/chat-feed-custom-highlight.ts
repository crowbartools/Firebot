import { EffectType } from "../../../types/effects";
import { TriggersObject } from '../../../types/triggers';
import frontendCommunicator from "../../common/frontend-communicator";
import logger from "../../logwrapper";

const triggers: TriggersObject = {};
triggers["command"] = true;
triggers["event"] = ["twitch:chat-message", "twitch:viewer-arrived"];

const effect: EffectType<{
    highlightEnabled: boolean;
    bannerEnabled: boolean;
    customHighlightColor?: string;
    customBannerText?: string;
    customBannerIcon?: string;
}> = {
    definition: {
        id: "firebot:chat-feed-custom-highlight",
        name: "Highlight Message In Chat Feed",
        description: "Apply a custom highlight and/or banner to a message in the Firebot chat feed",
        icon: "fas fa-highlighter",
        categories: ["common", "chat based", "dashboard"],
        dependencies: ["chat"],
        triggers: triggers
    },
    optionsTemplate: `
    <eos-container pad-top="true">
        <p>This will highlight and/or add a banner to a chat message in the Firebot dashboard.</p>
        <p>This does <b>not</b> affect how this message is displayed in Twitch chat, browser overlays, or any other chat client you may be using.</p>
    </eos-container>

    <eos-container header="Highlight" pad-top="true">
        <firebot-checkbox
            label="Highlight Message"
            model="effect.highlightEnabled"
        />

        <p class="muted">Select the color for the highlight.</p>

        <color-picker-input style="margin-top:10px" model="effect.customHighlightColor" label="Color"></color-picker-input>
    </eos-container>

    <eos-container header="Banner" pad-top="true">
        <firebot-checkbox
            label="Add a Banner"
            model="effect.bannerEnabled"
        />

        <p class="muted">Enter the text for the banner.</p>

        <firebot-input
            model="effect.customBannerText"
            placeholder-text="Enter banner text"
            pad-top="true"
            rows="4"
            useTextArea="true"
            cols="40"
            menu-position="under"
        />

        <p class="muted" style="margin-top: 20px;">Select the icon for the banner.</p>

        <input
            maxlength="2"
            type="text"
            pad-top="true"
            class="form-control"
            ng-model="effect.customBannerIcon"
            icon-picker required
        />
    </eos-container>
    `,
    optionsController: ($scope) => {
        if ($scope.effect.customHighlightColor === undefined) {
            $scope.effect.customHighlightColor = "#ffcc00"; // Default highlight color
        }
        if ($scope.effect.customBannerText === undefined) {
            $scope.effect.customBannerText = ""; // Default banner text
        }
        if ($scope.effect.customBannerIcon === undefined) {
            $scope.effect.customBannerIcon = "fas fa-circle-info"; // Default banner icon
        }
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];
        if (!effect.highlightEnabled && !effect.bannerEnabled) {
            errors.push("At least one of 'Highlight Message' or 'Add a Banner' must be enabled, or this effect will not do anything.");
        }
        if (effect.highlightEnabled) {
            if (!effect.customHighlightColor) {
                errors.push("If 'Highlight Message' is enabled, you must provide a highlight color.");
            } else if (!/^#[0-9A-Fa-f]{6}$/.test(effect.customHighlightColor)) {
                errors.push("The highlight color must be a valid hex color code (e.g., #ffcc00).");
            }
        }
        if (effect.bannerEnabled) {
            if (!effect.customBannerIcon) {
                errors.push("If 'Add a Banner' is enabled, you must provide a banner icon.");
            }
            if (!effect.customBannerText) {
                errors.push("If 'Add a Banner' is enabled, you must provide banner text.");
            }
        }
        return errors;
    },
    onTriggerEvent: (event) => {
        const { effect, trigger } = event;

        let messageId: string | null = null;
        if (trigger.type === "command") {
            messageId = trigger.metadata.chatMessage?.id;
        } else if (trigger.type === "event") {
            messageId = trigger.metadata.eventData?.chatMessage?.id;
        }

        if (messageId) {
            const highlightData = {
                messageId: messageId,
                customHighlightColor: effect.highlightEnabled ? effect.customHighlightColor : undefined,
                customBannerText: effect.bannerEnabled ? effect.customBannerText : undefined,
                customBannerIcon: effect.bannerEnabled ? effect.customBannerIcon : undefined
            };
            logger.debug("chat-feed-custom-highlight: Highlighting message in chat feed: messageId=", messageId);
            frontendCommunicator.send("chat-feed-custom-highlight", highlightData);
        } else {
            logger.warn("chat-feed-custom-highlight: No messageId found in trigger. Cannot highlight message.");
        }
    }
};

export = effect;