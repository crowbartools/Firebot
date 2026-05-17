import type {
    FirebotChatMessage,
    OverlayWidgetType,
    IOverlayWidgetEventUtils,
    WidgetOverlayEvent,
    Animation
} from "../../../../types";

import type {
    ChatWidgetState,
    ChatMessageMessageData,
    DeleteMessageMessageData,
    DeleteUserMessagesMessageData
} from "./chat";

export type AdvancedChatWidgetSettings = {
    cssTemplate: string;

    defaultMessageHtmlTemplate: string;

    useSeparateTemplateForActions: boolean;
    actionHtmlTemplate?: string;

    useSeparateTemplateForHighlightedMessages: boolean;
    highlightedMessageHtmlTemplate?: string;

    showSharedChatMessages: boolean;
    useSeparateTemplateForSharedMessages?: boolean;
    sharedChatMessageHtmlTemplate?: string;

    showAnnouncements: boolean;
    useSeparateTemplateForAnnouncements?: boolean;
    announcementHtmlTemplate?: string;

    delayMessages: boolean;
    messageDelay?: number;
    newMessageEntryAnimation: Animation;
    autoRemoveMessages: boolean;
    messageTimeout?: number;
    messageExitAnimation?: Animation;
    thirdPartyEmotes: string[];
    hiddenUsers: string[];
};


export const chatAdvanced: OverlayWidgetType<AdvancedChatWidgetSettings, ChatWidgetState> = {
    id: "firebot:chat-advanced",
    name: "Chat (Advanced)",
    description: "An advanced chat feed for the overlay where you provide the HTML and CSS used to generate the widget content.",
    icon: "fa fa-comments-alt-dollar",
    userCanConfigure: {
        entryAnimation: false,
        exitAnimation: false
    },
    settingsSchema: [
        {
            name: "cssTemplate",
            title: "CSS Template",
            description: `Any CSS styles, along with custom CSS classes, that you want to use in your widget. This value will automatically be put inside of a \`<style>\` tag.

The following fields will automatically get replaced with their corresponding CSS class names:
- \`{{messageContainerClass}}\`: The \`<div>\` element automatically created by the widget that contains all the chat messages in this widget. Any new messages will be added as a child of this element.
- \`{{messageClass}}\`: A \`<div>\` element automatically created by the widget that contains a single message.`,
            type: "codemirror",
            default: "",
            settings: {
                mode: "css",
                theme: "blackboard"
            }
        },
        {
            name: "defaultMessageHtmlTemplate",
            title: "Default Message HTML Template",
            description: `The default message HTML template to use when generating the widget.

The following fields are available in messages:
- \`{{avatarUrl}}\`: URL for the chatter's avatar
- \`{{badges}}\`: HTML snippet for badges (i.e. each badge is converted to an \`<img>\` tag)
- \`{{chatMessage}}\`: Chat message with formatted emotes and cheermotes (e.g. emotes are converted to \`<img>\` tags)
- \`{{chatMessageRawText}}\`: Raw text of the chat message with no formatting for emotes, cheermotes, etc.
- \`{{pronouns}}\`: Chatter's pronouns, if set
- \`{{timestamp}}\`: Timestamp of when the message
- \`{{username}}\`: Chatter's display name
- \`{{usernameColor}}\`: Hex format of chatter's username color (e.g. \`#0066FF\`)`,
            type: "codemirror",
            default: "",
            settings: {
                mode: "htmlmixed",
                theme: "blackboard"
            },
            showBottomHr: true
        },
        {
            name: "useSeparateTemplateForActions",
            title: "Use Separate Template for Actions",
            description: "Whether or not to use a different HTML template for `/me` actions",
            type: "boolean",
            default: true
        },
        {
            name: "actionHtmlTemplate",
            title: "Action HTML Template",
            description: "HTML template to use for `/me` actions. The same fields in the default message template are available here.",
            type: "codemirror",
            default: "",
            settings: {
                mode: "htmlmixed",
                theme: "blackboard"
            },
            showIf: {
                useSeparateTemplateForActions: true
            },
            showBottomHr: true
        },
        {
            name: "useSeparateTemplateForHighlightedMessages",
            title: "Use Separate Template for Highlighted Messages",
            description: "Whether or not to use a different HTML template for messages sent using the \"Highlight My Message\" channel point reward.",
            type: "boolean",
            default: true
        },
        {
            name: "highlightedMessageHtmlTemplate",
            title: "Highlighted Message HTML Template",
            description: "HTML template to use for messages sent using the \"Highlight My Message\" channel point reward. The same fields in the default message template are available here.",
            type: "codemirror",
            default: "",
            settings: {
                mode: "htmlmixed",
                theme: "blackboard"
            },
            showIf: {
                useSeparateTemplateForHighlightedMessages: true
            },
            showBottomHr: true
        },
        {
            name: "showSharedChatMessages",
            title: "Show Shared Chat Messages",
            description: "Display chat messages sent from other channels during a shared chat session",
            type: "boolean",
            default: false
        },
        {
            name: "useSeparateTemplateForSharedMessages",
            title: "Use Separate Template for Shared Chat Messages",
            description: "Whether or not to use a different HTML template for messages sent from other channels during a shared chat session.",
            type: "boolean",
            default: true,
            showIf: {
                showSharedChatMessages: true
            }
        },
        {
            name: "sharedChatMessageHtmlTemplate",
            title: "Shared Chat Message HTML Template",
            description: `HTML template to use for messages sent from other channels during a shared chat session.

 The same fields in the default message template are available here, plus these additional fields:
 - \`{{sharedChatRoomChannel}}\`: The display name of the external channel where the message was sent.
 - \`{{sharedChatRoomAvatarUrl}}\`: The avatar URL of the external channel where the message was sent.`,
            type: "codemirror",
            default: "",
            settings: {
                mode: "htmlmixed",
                theme: "blackboard"
            },
            showIf: {
                showSharedChatMessages: true,
                useSeparateTemplateForSharedMessages: true
            },
            showBottomHr: true
        },
        {
            name: "showAnnouncements",
            title: "Show Announcements",
            description: "Display chat announcements sent from the streamer or moderators",
            type: "boolean",
            default: false
        },
        {
            name: "useSeparateTemplateForAnnouncements",
            title: "Use Separate Template for Announcements",
            description: "Whether or not to use a different HTML template for announcements.",
            type: "boolean",
            default: true,
            showIf: {
                showAnnouncements: true
            }
        },
        {
            name: "announcementHtmlTemplate",
            title: "Announcement HTML Template",
            description: `HTML template to use for announcements.

The same fields in the default message template are available here, plus these additional fields:
- \`{{announcementColor}}\`: The name of the announcement color. It will be one of the following values: \`PRIMARY\`, \`BLUE\`, \`GREEN\`, \`ORANGE\`, or \`PURPLE\`.`,
            type: "codemirror",
            default: "",
            settings: {
                mode: "htmlmixed",
                theme: "blackboard"
            },
            showIf: {
                showAnnouncements: true,
                useSeparateTemplateForAnnouncements: true
            },
            showBottomHr: true
        },
        {
            name: "delayMessages",
            title: "Add Message Delay",
            description: "Adds a delay between when a message arrives and when it is sent to the widget. Useful for moderation.",
            type: "boolean",
            default: false
        },
        {
            name: "messageDelay",
            title: "Message Delay",
            description: "How long (in seconds) to wait before sending a chat message to the widget",
            type: "number",
            default: 0,
            showIf: {
                delayMessages: true
            }
        },
        {
            name: "newMessageEntryAnimation",
            title: "New Message Entry Animation",
            description: "Animation to use when new messages arrive",
            type: "animation-select",
            animationType: "enter"
        },
        {
            name: "autoRemoveMessages",
            title: "Automatically Remove Messages",
            description: "Removes messages from the chat widget after a specified amount of time",
            type: "boolean",
            default: false
        },
        {
            name: "messageTimeout",
            title: "Message Timeout",
            description: "Amount of time (in seconds) to automatically remove chat messages from the widget",
            type: "number",
            default: 10,
            showIf: {
                autoRemoveMessages: true
            }
        },
        {
            name: "messageExitAnimation",
            title: "Message Exit Animation",
            description: "Animation to use when messages are automatically removed from the widget",
            type: "animation-select",
            animationType: "exit",
            showIf: {
                autoRemoveMessages: true
            }
        },
        {
            name: "thirdPartyEmotes",
            title: "Enabled Third-Party Emote Providers",
            description: "NOTE: Any third-party emote services enabled here must also be enabled in Dashboard settings in order to show emotes from those services.",
            type: "multiselect",
            default: [],
            settings: {
                options: [
                    {
                        id: "BTTV",
                        name: "BTTV"
                    },
                    {
                        id: "7TV",
                        name: "7TV"
                    },
                    {
                        id: "FFZ",
                        name: "FFZ"
                    }
                ]
            }
        },
        {
            name: "hiddenUsers",
            title: "Hidden Users",
            description: "List of usernames whose messages will not be displayed in the chat widget",
            type: "editable-list",
            default: [],
            settings: {
                useTextArea: false,
                sortable: true,
                addLabel: "Add Username",
                editLabel: "Edit Username",
                noneAddedText: "No users hidden in chat widget"
            }
        }
    ],
    initialState: {
        chatMessages: []
    },
    supportsLivePreview: true,
    livePreviewState: {
        chatMessages: [
            {
                id: "",
                timestamp: 1777003200000,
                username: "firebot",
                userId: "0",
                userDisplayName: "Firebot",
                profilePicUrl: "https://firebot.app/_next/image?url=%2Ffirebot-logo.png&w=96&q=75",
                color: "#FFCA03",
                rawText: "thinks chat widgets are neat",
                badges: [
                    {
                        title: "moderator",
                        url: "https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1"
                    }
                ],
                parts: [
                    {
                        type: "text",
                        text: "thinks chat widgets are neat"
                    }
                ],
                action: true,
                whisper: false,
                tagged: false,
                isSharedChatMessage: false,
                sharedChatRoomProfilePicUrl: "https://static-cdn.jtvnw.net/jtv_user_pictures/4fe04c1f-8390-4ded-bcb0-cae9b1d7cb9c-profile_image-70x70.png",
                roles: []
            },
            {
                id: "",
                timestamp: 1777003260000,
                username: "zunderscore",
                userId: "0",
                userDisplayName: "zunderscore",
                profilePicUrl: "https://static-cdn.jtvnw.net/jtv_user_pictures/4fe04c1f-8390-4ded-bcb0-cae9b1d7cb9c-profile_image-70x70.png",
                pronouns: "He/Him",
                color: "#0066FF",
                rawText: "Wow, this IS really neat! zunder2Wow",
                badges: [
                    {
                        title: "broadcaster",
                        url: "https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/2"
                    }
                ],
                parts: [
                    {
                        type: "text",
                        text: "Wow, this IS really neat! "
                    },
                    {
                        type: "emote",
                        url: "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_ad007f2d2f77444295c883b0a6eaf572/static/light/3.0",
                        name: "zunder2Wow"
                    }
                ],
                action: false,
                whisper: false,
                tagged: false,
                isSharedChatMessage: false,
                sharedChatRoomProfilePicUrl: "https://static-cdn.jtvnw.net/jtv_user_pictures/4fe04c1f-8390-4ded-bcb0-cae9b1d7cb9c-profile_image-70x70.png",
                roles: []
            },
            {
                id: "",
                timestamp: 1777003260000,
                username: "ebiggz",
                userId: "0",
                userDisplayName: "ebiggz",
                profilePicUrl: "https://static-cdn.jtvnw.net/jtv_user_pictures/5545fe76-a341-4ffb-bc79-7ca8075588a1-profile_image-70x70.png",
                pronouns: "He/Him",
                color: "#00d1ff",
                rawText: "Yo, what's going on over there?",
                badges: [
                    {
                        title: "glhf",
                        url: "https://static-cdn.jtvnw.net/badges/v1/3158e758-3cb4-43c5-94b3-7639810451c5/2"
                    }
                ],
                parts: [
                    {
                        type: "text",
                        text: "Yo, what's going on over there?"
                    }
                ],
                action: false,
                whisper: false,
                tagged: false,
                isSharedChatMessage: true,
                sharedChatRoomDisplayName: "ebiggz",
                sharedChatRoomProfilePicUrl: "https://static-cdn.jtvnw.net/jtv_user_pictures/5545fe76-a341-4ffb-bc79-7ca8075588a1-profile_image-70x70.png",
                roles: []
            },
            {
                id: "",
                timestamp: 1777003320000,
                username: "zunderscore",
                userId: "0",
                userDisplayName: "zunderscore",
                profilePicUrl: "https://static-cdn.jtvnw.net/jtv_user_pictures/4fe04c1f-8390-4ded-bcb0-cae9b1d7cb9c-profile_image-70x70.png",
                pronouns: "He/Him",
                color: "#0066FF",
                rawText: "Super cool stuff!",
                badges: [
                    {
                        title: "broadcaster",
                        url: "https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/2"
                    }
                ],
                parts: [
                    {
                        type: "text",
                        text: "Super cool stuff!"
                    }
                ],
                action: false,
                whisper: false,
                tagged: false,
                isSharedChatMessage: false,
                sharedChatRoomProfilePicUrl: "https://static-cdn.jtvnw.net/jtv_user_pictures/4fe04c1f-8390-4ded-bcb0-cae9b1d7cb9c-profile_image-70x70.png",
                isHighlighted: true,
                roles: []
            },
            {
                id: "",
                timestamp: 1777003320000,
                username: "firebot",
                userId: "0",
                userDisplayName: "Firebot",
                profilePicUrl: "https://firebot.app/_next/image?url=%2Ffirebot-logo.png&w=96&q=75",
                color: "#FFCA03",
                rawText: "Don't forget to show love to your fellow Firebot users! <3",
                badges: [
                    {
                        title: "moderator",
                        url: "https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1"
                    }
                ],
                parts: [
                    {
                        type: "text",
                        text: "Don't forget to show love to your fellow Firebot users! "
                    },
                    {
                        type: "emote",
                        url: "https://static-cdn.jtvnw.net/emoticons/v2/9/default/dark/2.0#e=0",
                        name: "<3"
                    }
                ],
                action: false,
                isAnnouncement: true,
                announcementColor: "ORANGE",
                whisper: false,
                tagged: false,
                isSharedChatMessage: false,
                sharedChatRoomProfilePicUrl: "https://static-cdn.jtvnw.net/jtv_user_pictures/4fe04c1f-8390-4ded-bcb0-cae9b1d7cb9c-profile_image-70x70.png",
                roles: []
            }
        ]
    },
    uiActions: [
        {
            id: "clear",
            label: "Clear Chat Widget",
            icon: "fa-minus-circle",
            click: () => {
                return {
                    newState: {
                        chatMessages: null
                    }
                };
            }
        }
    ],
    overlayExtension: {
        eventHandler: (event: WidgetOverlayEvent<AdvancedChatWidgetSettings, ChatWidgetState>, utils: IOverlayWidgetEventUtils) => {
            const generateChatMessageHtml = (
                chatMessage: FirebotChatMessage,
                config: typeof event["data"]["widgetConfig"]
            ): string | undefined => {
                // Ignore AutoModded messages that aren't approved
                if (chatMessage.autoModStatus === "pending"
                        || chatMessage.autoModStatus === "denied"
                        || chatMessage.autoModStatus === "expired") {
                    return;
                }

                // Check the ignore list
                if (config.settings.hiddenUsers?.some(u =>
                    u.toLowerCase() === chatMessage.username.toLowerCase() || u.toLowerCase() === chatMessage.userDisplayName?.toLowerCase()
                )) {
                    return;
                }

                let templateBase = config.settings.defaultMessageHtmlTemplate;

                // Don't render announcements unless we specifically want them
                if (chatMessage.isAnnouncement === true) {
                    if (config.settings.showAnnouncements !== true) {
                        return;
                    } else if (config.settings.useSeparateTemplateForAnnouncements === true) {
                        templateBase = (config.settings.announcementHtmlTemplate ?? "")
                            .replaceAll("{{announcementColor}}", chatMessage.announcementColor ?? "PRIMARY");
                    }
                }

                // Same with shared chat messages
                if (chatMessage.isSharedChatMessage === true) {
                    if (config.settings.showSharedChatMessages !== true) {
                        return;
                    } else if (config.settings.useSeparateTemplateForSharedMessages === true) {
                        templateBase = (config.settings.sharedChatMessageHtmlTemplate ?? "")
                            .replaceAll("{{sharedChatRoomChannel}}", chatMessage.sharedChatRoomDisplayName ?? chatMessage.sharedChatRoomUsername ?? "")
                            .replaceAll("{{sharedChatRoomAvatarUrl}}", chatMessage.sharedChatRoomProfilePicUrl ?? "");
                    }
                }

                if (chatMessage.action === true
                    && config.settings.useSeparateTemplateForActions === true
                ) {
                    templateBase = config.settings.actionHtmlTemplate ?? "";
                }

                if (chatMessage.isHighlighted === true
                    && config.settings.useSeparateTemplateForHighlightedMessages === true
                ) {
                    templateBase = config.settings.highlightedMessageHtmlTemplate ?? "";
                }

                const messageClass = `chat-message-${config.id}`;

                templateBase = `<div
                    class="${messageClass}"
                    data-message-id="${chatMessage.id}"
                    data-username="${chatMessage.username}"
                >${templateBase}</div>`;

                let timestampString: string;
                if (chatMessage.timestamp) {
                    const timestampAsDate = new Date(chatMessage.timestamp);
                    const hours = timestampAsDate.getHours() % 12 === 0
                        ? "12"
                        : timestampAsDate.getHours() % 12;
                    const minutes = String(timestampAsDate.getMinutes()).padStart(2, "0");

                    timestampString = `${hours}:${minutes}`;
                }

                let badgeHtml = "";
                for (const badge of chatMessage.badges) {
                    const badgeElem = document.createElement("img");
                    badgeElem.src = badge.url;
                    badgeElem.alt = badge.title;

                    badgeHtml += badgeElem.outerHTML;
                }

                const chatMessagePartsHtml: Array<string> = [];

                for (const part of chatMessage.parts) {
                    switch (part.type) {
                        case "emote":
                            {
                                const emoteElem = document.createElement("img");
                                emoteElem.src = (part.animatedUrl ?? part.url)!;
                                emoteElem.alt = part.name!;

                                chatMessagePartsHtml.push(emoteElem.outerHTML);
                            }
                            break;

                        case "third-party-emote":
                            if (config.settings.thirdPartyEmotes.some(e => e === part.origin)) {
                                const emoteElem = document.createElement("img");
                                emoteElem.src = (part.animatedUrl ?? part.url)!;
                                emoteElem.alt = part.name!;

                                chatMessagePartsHtml.push(emoteElem.outerHTML);
                            } else {
                                chatMessagePartsHtml.push(part.name);
                            }
                            break;

                        case "cheermote":
                            {
                                const cheermoteElem = document.createElement("img");
                                cheermoteElem.src = (part.animatedUrl ?? part.url)!;
                                cheermoteElem.alt = part.name!;

                                const cheerAmountElem = document.createElement("strong");
                                cheerAmountElem.style.color = part.color!;
                                cheerAmountElem.innerText = `${part.amount}`;

                                chatMessagePartsHtml.push(cheermoteElem.outerHTML);
                                chatMessagePartsHtml.push(cheerAmountElem.outerHTML);
                            }
                            break;

                        case "link":
                            chatMessagePartsHtml.push(part.url);
                            break;

                        default:
                            chatMessagePartsHtml.push(part.text);
                    }
                }

                return templateBase
                    .replaceAll("{{timestamp}}", timestampString)
                    .replaceAll("{{avatarUrl}}", chatMessage.profilePicUrl ?? "")
                    .replaceAll("{{badges}}", badgeHtml)
                    .replaceAll("{{username}}", chatMessage.userDisplayName ?? chatMessage.username)
                    .replaceAll("{{usernameColor}}", chatMessage.color ?? "")
                    .replaceAll("{{pronouns}}", chatMessage.pronouns ?? "")
                    .replaceAll("{{chatMessage}}", chatMessagePartsHtml.join(""))
                    .replaceAll("{{chatMessageRawText}}", chatMessage.rawText);
            };

            const generateWidgetHtml = (config: typeof event["data"]["widgetConfig"]) => {
                const messageContainerClass = `chat-${event.data.widgetConfig.id}`;
                const messageClass = `chat-message-${event.data.widgetConfig.id}`;

                const cssTemplate = (config.settings.cssTemplate ?? "")
                    .replaceAll("{{messageContainerClass}}", `.${messageContainerClass}`)
                    .replaceAll("{{messageClass}}", `.${messageClass}`);

                const styleMarkup = `<style>${cssTemplate}</style>`;

                const messages: string[] = [];

                for (const chatMessage of config.state?.chatMessages ?? []) {
                    const messageHtml = generateChatMessageHtml(chatMessage, config);

                    if (!!messageHtml?.length) {
                        messages.push(messageHtml);
                    }
                }

                return `${styleMarkup}<div class="${messageContainerClass}">${messages.join("\n")}</div>`;
            };

            switch (event.name) {
                case "show":
                    utils.initializeWidget(generateWidgetHtml(event.data.widgetConfig));
                    break;

                case "settings-update":
                    utils.updateWidgetContent(generateWidgetHtml(event.data.widgetConfig));
                    utils.updateWidgetPosition();
                    break;

                case "message":
                    switch (event.data.messageName) {
                        case "chat-message":
                            {
                                const chatMessage = (event.data.messageData as ChatMessageMessageData).chatMessage;
                                const newMessageHtml = generateChatMessageHtml(
                                    chatMessage,
                                    event.data.widgetConfig
                                );

                                try {
                                    if (newMessageHtml) {
                                        const chatContainer = document.getElementsByClassName(`chat-${event.data.widgetConfig.id}`)[0];
                                        chatContainer.insertAdjacentHTML("beforeend", newMessageHtml);

                                        const animationClass = event.data.widgetConfig.settings.newMessageEntryAnimation?.class;
                                        const animationDuration = event.data.widgetConfig.settings.newMessageEntryAnimation?.duration;

                                        if (animationClass != null && animationClass !== "" && animationClass !== "none") {
                                            const duration = animationDuration ? `${animationDuration}s` : undefined;
                                            // @ts-ignore
                                            // eslint-disable-next-line
                                            $(`.chat-${event.data.widgetConfig.id}`).find(`[data-message-id="${chatMessage.id}"]`).animateCss(animationClass, duration);
                                        }

                                        // Trim excess
                                        while (chatContainer.childElementCount > 100) {
                                            chatContainer.removeChild(chatContainer.firstElementChild);
                                        }
                                    }
                                } catch { }
                            }
                            break;

                        case "delete-message":
                            {
                                const messageId = (event.data.messageData as DeleteMessageMessageData).messageId;
                                const animate = (event.data.messageData as DeleteMessageMessageData).animate;

                                try {
                                    const messageToRemove = document.querySelector(`[data-message-id="${messageId}"]`);
                                    const chatContainer = document.getElementsByClassName(`chat-${event.data.widgetConfig.id}`)[0];

                                    if (messageToRemove) {
                                        if (animate === true) {
                                            const animationClass = event.data.widgetConfig.settings.messageExitAnimation?.class;
                                            const animationDuration = event.data.widgetConfig.settings.messageExitAnimation?.duration;

                                            if (animationClass != null && animationClass !== "" && animationClass !== "none") {
                                                const duration = animationDuration ? `${animationDuration}s` : undefined;

                                                // @ts-ignore
                                                // eslint-disable-next-line
                                                $(`.chat-${event.data.widgetConfig.id}`).find(`[data-message-id="${messageId}"]`).animateCss(animationClass, duration, null, null, () => {
                                                    chatContainer.removeChild(messageToRemove);
                                                });
                                            } else {
                                                chatContainer.removeChild(messageToRemove);
                                            }
                                        } else {
                                            chatContainer.removeChild(messageToRemove);
                                        }
                                    }
                                } catch { }
                            }
                            break;

                        case "delete-user-messages":
                            try {
                                const messagesToRemove = document.querySelectorAll(`[data-username="${(event.data.messageData as DeleteUserMessagesMessageData).username}"]`);
                                const chatContainer = document.getElementsByClassName(`chat-${event.data.widgetConfig.id}`)[0];
                                for (const messageToRemove of messagesToRemove) {
                                    chatContainer.removeChild(messageToRemove);
                                }
                            } catch { }
                            break;
                    }
                    break;

                case "remove":
                    utils.removeWidget();
                    break;

                case "state-update":
                    // If we've set the chat message state to null, we're clearing the widget
                    if (event.data.widgetConfig.state?.chatMessages == null) {
                        utils.updateWidgetContent(generateWidgetHtml(event.data.widgetConfig));
                    }
                    break;

                default:
                    break;
            }
        }
    }
};