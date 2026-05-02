import type {
    FirebotChatMessage,
    OverlayWidgetType,
    IOverlayWidgetEventUtils,
    WidgetOverlayEvent,
    FontOptions,
    Animation
} from "../../../../types";

export type ChatWidgetSettings = {
    showTimestamps?: boolean;
    showAvatars?: boolean;
    showBadges?: boolean;
    showPronouns?: boolean;
    showSharedChatMessages?: boolean;
    showSharedChatInfo?: boolean;
    showAnnouncements?: boolean;
    delayMessages?: boolean;
    messageDelay?: number;
    newMessageEntryAnimation: Animation;
    autoRemoveMessages?: boolean;
    messageTimeout?: number;
    messageExitAnimation?: Animation;
    messageStyle?: "compact" | "modern";
    chatOrder?: "normal" | "reversed";
    actionDisplayFormat: "modern" | "classic";
    highlightStyle?: "normal" | "highlighted";
    highlightColor?: string;
    thirdPartyEmotes: string[];
    hiddenUsers: string[];
    horizontalAlignment: "left" | "right";
    verticalAlignment: "top" | "bottom";
    spaceBetweenMessages?: number;
    usernameFontOptions: FontOptions;
    messageFontOptions: FontOptions;
};

export type ChatWidgetState = {
    chatMessages: Array<FirebotChatMessage>;
};

type ChatMessageMessageData = {
    chatMessage: FirebotChatMessage;
};

type DeleteMessageMessageData = {
    messageId: string;
    animate: boolean;
};

type DeleteUserMessagesMessageData = {
    username: string;
};

export const chat: OverlayWidgetType<ChatWidgetSettings, ChatWidgetState> = {
    id: "firebot:chat",
    name: "Chat",
    description: "A basic chat feed for the overlay",
    icon: "fa fa-comments-alt",
    userCanConfigure: {
        entryAnimation: false,
        exitAnimation: false
    },
    settingsSchema: [
        {
            name: "showTimestamps",
            title: "Show Timestamps",
            type: "boolean",
            default: false
        },
        {
            name: "showAvatars",
            title: "Show Viewer Avatars",
            type: "boolean",
            default: true
        },
        {
            name: "showBadges",
            title: "Show Chat Badges",
            description: "Show chat badges (sub, bits tiers, etc.) next to usernames",
            type: "boolean",
            default: true
        },
        {
            name: "showPronouns",
            title: "Show Pronouns",
            description: "Show chatter pronouns (provided by [https://pr.alejo.io/](https://pr.alejo.io/))",
            type: "boolean",
            default: false
        },
        {
            name: "showSharedChatMessages",
            title: "Show Shared Chat Messages",
            description: "Display chat messages sent from other channels during a shared chat session",
            type: "boolean",
            default: false
        },
        {
            name: "showSharedChatInfo",
            title: "Show Shared Chat Info",
            description: "Display info about the channel a chat message was sent in during a shared chat session in the chat feed",
            type: "boolean",
            default: true,
            showIf: {
                showSharedChatMessages: true
            }
        },
        {
            name: "showAnnouncements",
            title: "Show Announcements",
            description: "Display chat announcements sent from the streamer or moderators",
            type: "boolean",
            default: false
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
            name: "messageStyle",
            title: "Message Style",
            type: "radio-cards",
            default: "compact",
            options: [
                {
                    value: "compact",
                    label: "Compact",
                    description: "Username and chat message are displayed on the same line",
                    iconClass: "fa-horizontal-rule"
                },
                {
                    value: "modern",
                    label: "Modern (Expanded)",
                    description: "Username and chat message are displayed on separate lines",
                    iconClass: "fa-line-height"
                }
            ]
        },
        {
            name: "chatOrder",
            title: "Chat Order",
            type: "radio-cards",
            default: "normal",
            options: [
                {
                    value: "normal",
                    label: "Normal",
                    description: "New messages will appear at the bottom of the chat feed",
                    iconClass: "fa-sort-amount-down-alt"
                },
                {
                    value: "reversed",
                    label: "Reversed",
                    description: "New messages will appear at the top of the chat feed",
                    iconClass: "fa-sort-amount-up"
                }
            ]
        },
        {
            name: "actionDisplayFormat",
            title: "Action Display Format",
            description: "The style used to display `/me` actions",
            type: "radio-cards",
            default: "modern",
            options: [
                {
                    value: "modern",
                    label: "Modern",
                    description: "Action text is the same color as normal chat messages but italicized, like Twitch does today",
                    iconClass: "fa-italic"
                },
                {
                    value: "classic",
                    label: "Classic",
                    description: "Action text is the same color as the username but not italicized, like Twitch used to do",
                    iconClass: "fa-palette"
                }
            ]
        },
        {
            name: "highlightStyle",
            title: "Highlighted Message Style",
            type: "radio-cards",
            default: "normal",
            options: [
                {
                    value: "normal",
                    label: "Normal",
                    description: "Highlighted messages will look just like regular messages",
                    iconClass: "fa-tint-slash"
                },
                {
                    value: "highlighted",
                    label: "Highlighted",
                    description: "Highlighted messages will have a different background color, similar to how Twitch displays them",
                    iconClass: "fa-tint"
                }
            ]
        },
        {
            name: "highlightColor",
            title: "Highlighted Message Background Color",
            type: "hexcolor",
            default: "#755ebc",
            allowAlpha: true,
            validation: {
                required: true,
                pattern: "^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$"
            },
            showIf: {
                highlightStyle: "highlighted"
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
        },
        {
            name: "horizontalAlignment",
            title: "Horizontal Alignment",
            description: "Horizontal alignment of the chat messages within the widget area.",
            type: "radio-cards",
            default: "left",
            options: [{
                value: "left", label: "Left", iconClass: "fa-align-left"
            }, {
                value: "right", label: "Right", iconClass: "fa-align-right"
            }],
            settings: {
                gridColumns: 2
            }
        },
        {
            name: "verticalAlignment",
            title: "Vertical Alignment",
            description: "Vertical alignment of the chat messages within the widget area.",
            type: "radio-cards",
            default: "top",
            options: [{
                value: "top", label: "Top", iconClass: "fa-arrow-to-top"
            }, {
                value: "bottom", label: "Bottom", iconClass: "fa-arrow-to-bottom"
            }],
            settings: {
                gridColumns: 2
            }
        },
        {
            name: "spaceBetweenMessages",
            title: "Space Between Messages",
            description: "How much space (in pixels) to put between messages in the feed",
            type: "number",
            default: 5
        },
        {
            name: "usernameFontOptions",
            title: "Username Font Options",
            type: "font-options",
            default: {
                family: "Inter",
                weight: 700,
                size: 24,
                italic: false
            },
            allowAlpha: true,
            hideColor: true
        },
        {
            name: "messageFontOptions",
            title: "Chat Message Font Options",
            type: "font-options",
            default: {
                family: "Inter",
                weight: 400,
                size: 24,
                italic: false,
                color: "#FFFFFF"
            },
            allowAlpha: true
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
                roles: []
            }
        ]
    },
    overlayExtension: {
        eventHandler: (event: WidgetOverlayEvent<ChatWidgetSettings, ChatWidgetState>, utils: IOverlayWidgetEventUtils) => {
            const generateAnnouncementBarStyle = (
                announcementColor: FirebotChatMessage["announcementColor"],
                horizontalAlignment: typeof event["data"]["widgetConfig"]["settings"]["horizontalAlignment"]
            ): Record<string, string> => {
                let announcementBackgroundColor: string;

                switch (announcementColor) {
                    case "BLUE":
                        announcementBackgroundColor = "linear-gradient(#00d6d6,#9146ff)";
                        break;

                    case "GREEN":
                        announcementBackgroundColor = "linear-gradient(#00db84,#57bee6)";
                        break;

                    case "ORANGE":
                        announcementBackgroundColor = "linear-gradient(#ffb31a,#e0e000)";
                        break;

                    case "PURPLE":
                        announcementBackgroundColor = "linear-gradient(#9146ff,#ff75e6)";
                        break;

                    default:
                        announcementBackgroundColor = "rgb(31, 105, 255)";
                        break;
                }

                const individualAnnouncementBarStyles: Record<string, string> = {
                    "background": announcementBackgroundColor
                };

                switch (horizontalAlignment) {
                    case "right":
                        individualAnnouncementBarStyles["margin-left"] = "10px";
                        break;

                    default:
                        individualAnnouncementBarStyles["margin-right"] = "10px";
                        break;
                }

                return individualAnnouncementBarStyles;
            };

            const generateChatMessageHtml = (
                chatMessage: FirebotChatMessage,
                config: typeof event["data"]["widgetConfig"]
            ): string => {
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

                // Don't render announcements unless we specifically want them
                if (chatMessage.isAnnouncement === true && config.settings.showAnnouncements !== true) {
                    return;
                }

                // Same with shared chat messages
                if (chatMessage.isSharedChatMessage === true && config.settings.showSharedChatMessages !== true) {
                    return;
                }

                const messageContainerStyle: Record<string, string> = { };

                if (chatMessage.isAnnouncement === true) {
                    messageContainerStyle["display"] = "flex";
                    messageContainerStyle["flex-direction"] = "row";
                }

                let messageHtml = `
                <div
                    data-message-id="${chatMessage.id}"
                    data-username="${chatMessage.username}"
                    style="${utils.stylesToString(messageContainerStyle)}">`;

                if (chatMessage.isAnnouncement === true) {
                    let header = "Announcement";

                    if (chatMessage.isSharedChatMessage) {
                        header += `, sent from ${chatMessage.sharedChatRoomDisplayName}'s chat`;
                    }

                    if (config.settings.horizontalAlignment === "left") {
                        const individualAnnouncementBarStyles = generateAnnouncementBarStyle(
                            chatMessage.announcementColor,
                            config.settings.horizontalAlignment
                        );

                        messageHtml += `
                                <div class="chat-announcement-bar-${config.id}" style="${utils.stylesToString(individualAnnouncementBarStyles)}"></div>
                                <div class="chat-message-container-${config.id}">
                                    <div class="chat-message-header-${config.id}">${header}</div>`;
                    } else {
                        messageHtml += `
                                <div class="chat-message-container-${config.id}">
                                    <div class="chat-message-header-${config.id}">${header}</div>`;
                    }
                } else {
                    if (chatMessage.isSharedChatMessage && config.settings.showSharedChatInfo) {
                        messageHtml += `
                                <div class="chat-message-container-${config.id}">
                                    <div class="chat-message-header-${config.id}">Sent from ${chatMessage.sharedChatRoomDisplayName}'s chat</div>`;
                    }
                }

                messageHtml += `<div class="chat-message-content-container-${config.id}"><span>`;

                let timestampString: string;
                if (config.settings.showTimestamps === true) {
                    const timestampAsDate = new Date(chatMessage.timestamp);
                    const hours = timestampAsDate.getHours() % 12 === 0
                        ? "12"
                        : timestampAsDate.getHours() % 12;
                    const minutes = String(timestampAsDate.getMinutes()).padStart(2, "0");

                    timestampString = `[${hours}:${minutes}]`;
                }

                if (timestampString?.length && config.settings.messageStyle === "compact") {
                    messageHtml += `<span class="chat-message-${config.id}">${timestampString} </span>`;
                }

                if (config.settings.showAvatars === true) {
                    messageHtml += `<img class="chat-avatar-${config.id}" src="${chatMessage.profilePicUrl}" alt="avatar" />`;
                }

                if (config.settings.showBadges === true && chatMessage.badges?.length) {
                    const badgesHtml: Array<string> = [];

                    for (const badge of chatMessage.badges) {
                        badgesHtml.push(`<img class="chat-badge-${config.id}" src="${badge.url}" alt="${badge.title}" />`);
                    }

                    messageHtml += `<span class="chat-badge-container-${config.id}">${badgesHtml.join("")}</span>`;
                }

                if (config.settings.showPronouns === true && !!chatMessage.pronouns?.length) {
                    messageHtml += `<span class="chat-pronouns-${config.id}">${chatMessage.pronouns}</span>`;
                }

                const individualUsernameStyles: Record<string, string> = {
                    "color": chatMessage.color
                };

                messageHtml += `<span class="chat-username-${config.id}" style="${utils.stylesToString(individualUsernameStyles)}">${chatMessage.userDisplayName ?? chatMessage.username}</span>`;

                if (timestampString?.length && config.settings.messageStyle === "modern") {
                    messageHtml += `<span class="chat-message-${config.id}"> ${timestampString}</span>`;
                }

                const chatMessagePartsHtml: string[] = [];

                for (const part of chatMessage.parts) {
                    switch (part.type) {
                        case "emote":
                            chatMessagePartsHtml.push(`<img src="${part.animatedUrl ?? part.url}" alt="${part.name}">`);
                            break;

                        case "third-party-emote":
                            if (config.settings.thirdPartyEmotes.some(e => e === part.origin)) {
                                chatMessagePartsHtml.push(`<img src="${part.animatedUrl ?? part.url}" alt="${part.name}">`);
                            } else {
                                chatMessagePartsHtml.push(part.name);
                            }
                            break;

                        case "cheermote":
                            chatMessagePartsHtml.push(`<img src="${part.animatedUrl ?? part.url}" alt="${part.name}"><strong style="color: ${part.color}">${part.amount}</strong>`);
                            break;

                        case "link":
                            chatMessagePartsHtml.push(part.url);
                            break;

                        default:
                            chatMessagePartsHtml.push(part.text);
                    }
                }

                messageHtml += "</span><span>";

                if (chatMessage.action === true) {
                    const individualActionStyles: Record<string, string> = { };

                    if (config.settings.actionDisplayFormat === "classic") {
                        individualActionStyles["color"] = chatMessage.color;
                    }

                    messageHtml += `<span class="chat-message-${config.id} chat-action-${config.id}" style="${utils.stylesToString(individualActionStyles)}">${config.settings.messageStyle === "modern" ? "" : "&nbsp;"}`;
                } else {
                    messageHtml += `<span class="chat-message-${config.id}">${config.settings.messageStyle === "modern" ? "" : ": "}`;
                }

                if (chatMessage.isHighlighted === true && config.settings.highlightStyle === "highlighted") {
                    messageHtml += `<span class="chat-highlighted-message-${config.id}">${chatMessagePartsHtml.join("")}</span>`;
                } else {
                    messageHtml += `<span>${chatMessagePartsHtml.join("")}</span>`;
                }

                messageHtml += `</span></span>`;

                if (chatMessage.isAnnouncement === true) {
                    if (config.settings.horizontalAlignment === "right") {
                        const individualAnnouncementBarStyles = generateAnnouncementBarStyle(
                            chatMessage.announcementColor,
                            config.settings.horizontalAlignment
                        );

                        messageHtml += `</div></div><div class="chat-announcement-bar-${config.id}" style="${utils.stylesToString(individualAnnouncementBarStyles)}"></div>`;
                    } else {
                        messageHtml += "</div></div>";
                    }
                } else {
                    if (chatMessage.isSharedChatMessage && config.settings.showSharedChatInfo) {
                        messageHtml += "</div>";
                    }

                    messageHtml += `</div>`;
                }

                messageHtml += `</div>`;

                return messageHtml;
            };

            const generateWidgetHtml = (config: typeof event["data"]["widgetConfig"]) => {
                const usernameFontSize = (config.settings?.usernameFontOptions?.size ? `${config.settings.messageFontOptions.size}px` : "12px");
                const messageFontSize = (config.settings?.messageFontOptions?.size ? `${config.settings.messageFontOptions.size}px` : "12px");

                let height = "auto";
                let maxHeight = "100%";
                let justifyContent = "end";
                let anchorToBottom = false;

                switch (config.settings.chatOrder) {
                    case "reversed":
                        switch (config.settings.verticalAlignment) {
                            case "bottom":
                                // Special snowflake
                                anchorToBottom = true;
                                height = "auto";
                                maxHeight = "100%";
                                justifyContent = "start";
                                break;

                            case "top":
                            default:
                                height = "auto";
                                maxHeight = null;
                                justifyContent = "start";
                                break;
                        }
                        break;

                    case "normal":
                    default:
                        switch (config.settings.verticalAlignment) {
                            case "bottom":
                                height = "100%";
                                maxHeight = "100%";
                                justifyContent = "end";
                                break;

                            case "top":
                            default:
                                // Use default values
                                break;
                        }
                        break;
                }

                const chatContainerStyles: Record<string, string> = {
                    "display": "flex",
                    "flex-direction": config.settings.chatOrder === "reversed" ? "column-reverse" : "column",
                    "align-items": config.settings.horizontalAlignment === "right" ? "end" : "start",
                    "justify-content": justifyContent,
                    "height": height,
                    "width": "100%",
                    "text-align": config.settings.horizontalAlignment
                };

                if (maxHeight?.length) {
                    chatContainerStyles["max-height"] = maxHeight;
                }

                if (anchorToBottom) {
                    chatContainerStyles["position"] = "absolute";
                    chatContainerStyles["bottom"] = "0";
                }

                const announcementBarStyles: Record<string, string> = {
                    "width": "10px"
                };

                const announcementMessageContainerStyles: Record<string, string> = {
                    "display": "flex",
                    "flex-direction": "column"
                };

                const messageHeaderStyles: Record<string, string> = {
                    "font-family": (config.settings?.messageFontOptions?.family ? `"${config.settings?.messageFontOptions?.family}"` : "Inter, sans-serif"),
                    "font-size": `calc(${messageFontSize} * 0.75)`,
                    "font-weight": config.settings?.messageFontOptions?.weight?.toString() || "400",
                    "font-style": config.settings?.messageFontOptions?.italic ? "italic" : "normal",
                    "color": config.settings?.messageFontOptions?.color || "#FFFFFF",
                    "margin-bottom": "5px"
                };

                const messageContentContainerStyles: Record<string, string> = {
                    "display": "inline"
                };

                if (config.settings.messageStyle === "modern") {
                    messageContentContainerStyles["display"] = "flex";
                    messageContentContainerStyles["flex-direction"] = config.settings.messageStyle === "modern" ? "column" : "row";
                }

                const avatarStyles: Record<string, string> = {
                    "height": usernameFontSize,
                    "border-radius": "50%",
                    "margin-right": "5px"
                };

                const badgeStyles: Record<string, string> = {
                    "height": usernameFontSize
                };

                const pronounStyles: Record<string, string> = {
                    "border": `solid calc(${messageFontSize} * 0.05) ${config.settings?.messageFontOptions?.color || "#FFFFFF"}`,
                    "border-radius": `calc(${messageFontSize} * 0.25)`,
                    "font-family": (config.settings?.messageFontOptions?.family ? `"${config.settings?.messageFontOptions?.family}"` : "Inter, sans-serif"),
                    "font-size": `calc(${messageFontSize} * 0.75)`,
                    "font-weight": config.settings?.messageFontOptions?.weight?.toString() || "400",
                    "font-style": config.settings?.messageFontOptions?.italic ? "italic" : "normal",
                    "padding": `calc(${messageFontSize} * 0.15)`,
                    "margin-right": "5px"
                };

                const usernameStyles: Record<string, string> = {
                    "font-family": (config.settings?.usernameFontOptions?.family ? `"${config.settings?.messageFontOptions?.family}"` : "Inter, sans-serif"),
                    "font-size": usernameFontSize,
                    "font-weight": config.settings?.usernameFontOptions?.weight?.toString() || "700",
                    "font-style": config.settings?.usernameFontOptions?.italic ? "italic" : "normal"
                };

                const messageStyles: Record<string, string> = {
                    "font-family": (config.settings?.messageFontOptions?.family ? `"${config.settings?.messageFontOptions?.family}"` : "Inter, sans-serif"),
                    "font-size": messageFontSize,
                    "font-weight": config.settings?.messageFontOptions?.weight?.toString() || "400",
                    "font-style": config.settings?.messageFontOptions?.italic ? "italic" : "normal",
                    "color": config.settings?.messageFontOptions?.color || "#FFFFFF"
                };

                const highlightedMessageStyles: Record<string, string> = {
                    "background-color": config.settings.highlightColor
                };

                const actionStyles: Record<string, string> = {
                    "font-style": config.settings?.actionDisplayFormat === "classic" ? "normal" : "italic"
                };

                const styleMarkup = `
                    <style>
                        .chat-${config.id} {
                            ${utils.stylesToString(chatContainerStyles)}
                        }

                        .chat-${config.id} * {
                            vertical-align: middle;
                        }

                        .chat-${config.id} > div + div {
                            ${config.settings.chatOrder === "reversed" ? "margin-bottom" : "margin-top"}: ${config.settings.spaceBetweenMessages ?? 5}px;
                        }

                        .chat-announcement-bar-${config.id} {
                            ${utils.stylesToString(announcementBarStyles)}
                        }

                        .chat-message-container-${config.id} {
                            ${utils.stylesToString(announcementMessageContainerStyles)}
                        }

                        .chat-highlighted-message-${config.id} {
                            ${utils.stylesToString(highlightedMessageStyles)}
                        }

                        .chat-message-header-${config.id} {
                            ${utils.stylesToString(messageHeaderStyles)}
                        }

                        .chat-message-content-container-${config.id} {
                            ${utils.stylesToString(messageContentContainerStyles)}
                        }

                        .chat-avatar-${config.id} {
                            ${utils.stylesToString(avatarStyles)}
                        }

                        .chat-badge-container-${config.id} {
                            margin-right: 5px;
                        }

                        .chat-badge-${config.id} {
                            ${utils.stylesToString(badgeStyles)}
                        }

                        .chat-pronouns-${config.id} {
                            ${utils.stylesToString(pronounStyles)}
                        }

                        .chat-username-${config.id} {
                            ${utils.stylesToString(usernameStyles)}
                        }

                        .chat-message-${config.id} {
                            ${utils.stylesToString(messageStyles)}
                        }

                        .chat-action-${config.id} {
                            ${utils.stylesToString(actionStyles)}
                        }

                        .chat-message-${config.id} img,
                        .chat-action-${config.id} img {
                            height: ${messageFontSize};
                        }
                    </style>
                `;

                const messageDivs: string[] = [];

                for (const chatMessage of config.state?.chatMessages ?? []) {
                    const messageHtml = generateChatMessageHtml(chatMessage, config);

                    if (messageHtml?.length) {
                        messageDivs.push(messageHtml);
                    }
                }

                return `${styleMarkup}<div class="chat-${config.id}">${messageDivs.join("\n")}</div>`;
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
                                                $(`.chat-${event.data.widgetConfig.id}`).find(`[data-message-id="${messageId}"]`).animateCss(animationClass, duration, null, null, () => {
                                                    chatContainer.removeChild(messageToRemove);
                                                });
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

                        case "clear-chat":
                            try {
                                const chatContainer = document.getElementsByClassName(`chat-${event.data.widgetConfig.id}`)[0];
                                chatContainer.innerHTML = "";
                            } catch { }
                            break;
                    }
                    break;

                case "remove":
                    utils.removeWidget();
                    break;

                case "state-update":
                    // We don't really care about state here. We only care about state on reloads, which are handled above.
                    break;

                default:
                    break;
            }
        }
    }
};