"use strict";
(function() {
    angular
        .module('firebotApp')
        .component("chatMessage", {
            bindings: {
                message: "=",
                compactDisplay: "<",
                hideDeletedMessages: "<",
                showAvatar: "<",
                showTimestamp: "<",
                showBttvEmotes: "<",
                showFfzEmotes: "<",
                showSevenTvEmotes: "<",
                showPronoun: "<",
                hideReplyBanner: "<?",
                disableInteractions: "<?",
                updateChatInput: "&?",
                onReplyClicked: "&?",
                chatSizeStyle: "@?"
            },
            template: `
                <div class="chat-message-wrapper">
                    <div
                        ng-if="$ctrl.message.isAnnouncement"
                        class="announcement-bar"
                        ng-class="$ctrl.message.announcementColor"
                    >
                    </div>
                    <div
                        ng-if="$ctrl.message.isAutoModHeld"
                        class="automod-bar"
                        ng-class="$ctrl.message.autoModStatus"
                    >
                    </div>
                    <div
                        ng-if="$ctrl.message.isFirstChat || $ctrl.message.isReturningChatter || $ctrl.message.isRaider || $ctrl.message.isSuspiciousUser"
                        class="chat-highlight-bar"
                        ng-class="{'first-chat': $ctrl.message.isFirstChat, returning: $ctrl.message.isReturningChatter, raider: $ctrl.message.isRaider, suspicious: $ctrl.message.isSuspiciousUser}"
                    >
                    </div>
                    <div ng-if="$ctrl.message.isAnnouncement" class="chat-message-banner">
                        <i class="fad fa-bullhorn"></i> Announcement
                    </div>
                    <div ng-if="$ctrl.message.isFirstChat" class="chat-message-banner">
                        <i class="fad fa-sparkles"></i> First Time Chat
                    </div>
                    <div ng-if="$ctrl.message.isReturningChatter" class="chat-message-banner">
                        <i class="fad fa-repeat"></i> Returning Chatter
                    </div>
                    <div ng-if="$ctrl.message.isRaider" class="chat-message-banner">
                        <i class="fad fa-siren-on"></i> Raider from {{$ctrl.message.raidingFrom}}
                    </div>
                    <div ng-if="$ctrl.message.isSuspiciousUser" class="chat-message-banner">
                        <i class="fad fa-exclamation-triangle"></i> Suspicious User
                    </div>
                    <div ng-if="$ctrl.message.isReply && !$ctrl.hideReplyBanner" class="chat-message-banner mini-banner muted truncate" ng-click="$ctrl.replyBannerClicked()">
                        <i class="fad fa-comment-alt-dots"></i> Replying to @{{$ctrl.message.replyParentMessageSenderDisplayName}}: {{$ctrl.message.replyParentMessageText}}</span>
                    </div>
                    <div class="chat-message"
                        ng-class="{
                            isAction: $ctrl.message.action,
                            isWhisper: $ctrl.message.whisper,
                            isDeleted: $ctrl.message.deleted,
                            isTagged: $ctrl.message.tagged,
                            isCompact: $ctrl.compactDisplay,
                            spoilers: $ctrl.hideDeletedMessages,
                            isHighlighted: $ctrl.message.isHighlighted,
                            isCustomReward: $ctrl.message.customRewardId != null
                        }"
                        ng-attr-messageId="{{$ctrl.message.id}}"
                        context-menu="$ctrl.getMessageContextMenu($ctrl.message)"
                        context-menu-class="chat-message-context-menu"
                        context-menu-on="{{$ctrl.message.isExtension || $ctrl.disableInteractions ? 'disabled' : 'contextmenu'}}"
                    >
                        <div
                            ng-if="!$ctrl.compactDisplay"
                            ng-show="$ctrl.showAvatar"
                            class="chat-user-avatar-wrapper"
                            context-menu="$ctrl.getMessageContextMenu($ctrl.message)"
                            context-menu-class="chat-message-context-menu"
                            context-menu-on="{{$ctrl.message.isExtension || $ctrl.disableInteractions ? 'disabled' : 'click'}}"
                        >
                            <img class="chat-user-avatar" ng-src="{{$ctrl.message.profilePicUrl}}">
                        </div>
                        <div>

                            <span ng-if="$ctrl.compactDisplay" ng-show="$ctrl.showTimestamp" class="muted chat-timestamp">
                                {{$ctrl.message.timestampDisplay}}
                            </span>

                            <div
                                ng-if="$ctrl.compactDisplay"
                                class="chat-user-avatar-wrapper"
                                ng-show="$ctrl.showAvatar"
                                context-menu="$ctrl.getMessageContextMenu($ctrl.message)"
                                context-menu-class="chat-message-context-menu"
                                context-menu-on="{{$ctrl.message.isExtension || $ctrl.disableInteractions ? 'disabled' : 'click'}}"
                            >
                                <img class="chat-user-avatar" ng-src="{{$ctrl.message.profilePicUrl}}">
                            </div>

                            <div
                                class="chat-username"
                                context-menu="$ctrl.getMessageContextMenu($ctrl.message)"
                                context-menu-class="chat-message-context-menu"
                                context-menu-on="{{$ctrl.message.isExtension || $ctrl.disableInteractions ? 'disabled' : 'click'}}"
                            >
                                <div ng-show="$ctrl.message.badges.length > 0" class="user-badges">
                                    <img ng-repeat="badge in $ctrl.message.badges"
                                        ng-src="{{badge.url}}"
                                        uib-tooltip="{{badge.title}}"
                                        tooltip-append-to-body="true" />
                                </div>
                                <span
                                    class="pronoun"
                                    uib-tooltip="Pronouns"
                                    tooltip-append-to-body="true"
                                    ng-click="$root.openLinkExternally('https://pronouns.alejo.io/')"
                                    ng-show="$ctrl.showPronoun && $ctrl.pronouns.pronounCache[$ctrl.message.username] != null"
                                >{{$ctrl.pronouns.pronounCache[$ctrl.message.username]}}</span>
                                <b ng-style="{'color': $ctrl.message.color}">{{$ctrl.message.userDisplayName != null ? $ctrl.message.userDisplayName : $ctrl.message.username}}</b>
                                <span
                                    ng-if="$ctrl.message.username && $ctrl.message.userDisplayName && $ctrl.message.username.toLowerCase() !== $ctrl.message.userDisplayName.toLowerCase()"
                                    style="font-weight: 100"
                                    ng-style="{'color': $ctrl.message.color}"
                                    class="muted"
                                >&nbsp;({{$ctrl.message.username}})</span>
                                <span
                                    ng-if="$ctrl.compactDisplay && !$ctrl.message.action"
                                    style="color:white;font-weight:200;"
                                >:</span>
                                <span ng-if="!$ctrl.compactDisplay" ng-show="$ctrl.showTimestamp" class="muted chat-timestamp">
                                    {{$ctrl.message.timestampDisplay}}
                                </span>
                            </div>
                            <div class="chatContent">
                                <span ng-repeat="part in $ctrl.message.parts" class="chat-content-wrap">

                                    <span ng-if="part.type === 'text'" style="{{$ctrl.chatSizeStyle}}" ng-class="{ highlightText: part.flagged }">{{part.text}}</span>

                                    <a ng-if="part.type === 'link'" style="{{$ctrl.chatSizeStyle}}" ng-href="{{part.url}}" target="_blank">{{part.text}}</a>

                                    <span
                                        ng-if="part.type === 'cheer'"
                                        class="chatEmoticon"
                                        uib-tooltip="{{part.name}}"
                                        tooltip-append-to-body="true"
                                    >
                                        <img ng-if="part.animatedUrl != '' && part.animatedUrl != null" ng-src="{{part.animatedUrl}}" style="height: 100%;">
                                        <img ng-if="part.animatedUrl == '' || part.animatedUrl == null" ng-src="{{part.url}}" style="height: 100%;">
                                    </span>
                                    <span ng-if="part.type === 'cheer'" style="{{$ctrl.chatSizeStyle}}; font-weight: bold;" ng-style="{ color: part.color }" >{{part.amount}}</span>

                                    <span
                                        ng-if="part.type === 'emote'"
                                        class="chatEmoticon"
                                        uib-tooltip="{{part.origin}}: {{part.name}}"
                                        tooltip-append-to-body="true"
                                    >
                                        <img ng-if="part.animatedUrl != '' && part.animatedUrl != null" ng-src="{{part.animatedUrl}}" style="height: 100%;">
                                        <img ng-if="part.animatedUrl == '' || part.animatedUrl == null" ng-src="{{part.url}}" style="height: 100%;">
                                    </span>

                                    <span
                                        ng-if="part.origin === 'BTTV' && $ctrl.showBttvEmotes"
                                        class="chatEmoticon"
                                        uib-tooltip="{{part.origin}}: {{part.name}}"
                                        tooltip-append-to-body="true"
                                        style="width: unset;"
                                    >
                                        <img ng-src="{{part.url}}" style="height: 100%;" />
                                    </span>
                                    <span ng-if="part.origin === 'BTTV' && !$ctrl.showBttvEmotes" style="{{$ctrl.chatSizeStyle}}">{{part.name}}</span>

                                    <span
                                        ng-if="part.origin === 'FFZ' && $ctrl.showFfzEmotes"
                                        class="chatEmoticon"
                                        uib-tooltip="{{part.origin}}: {{part.name}}"
                                        tooltip-append-to-body="true"
                                        style="width: unset;"
                                    >
                                        <img ng-src="{{part.url}}" style="height: 100%;" />
                                    </span>
                                    <span ng-if="part.origin === 'FFZ' && !$ctrl.showFfzEmotes" style="{{$ctrl.chatSizeStyle}}">{{part.name}}</span>

                                    <span
                                        ng-if="part.origin === '7TV' && $ctrl.showSevenTvEmotes"
                                        class="chatEmoticon"
                                        uib-tooltip="{{part.origin}}: {{part.name}}"
                                        tooltip-append-to-body="true"
                                        style="width: unset;"
                                    >
                                        <img ng-src="{{part.url}}" style="height: 100%;" />
                                    </span>
                                    <span ng-if="part.origin === '7TV' && !$ctrl.showSevenTvEmotes" style="{{$ctrl.chatSizeStyle}}">{{part.name}}</span>
                                </span>
                            </div>
                            <div ng-show="$ctrl.message.whisper" class="muted">(Whispered to {{ $ctrl.message.whisperTarget }})</div>
                        </div>
                    </div>
                    <div class="automod-tag" ng-show="$ctrl.message.isAutoModHeld">
                        <div ng-if="$ctrl.message.autoModStatus === 'PENDING' && !$ctrl.message.autoModErrorMessage">
                            <span>Flagged by AutoMod ({{$ctrl.message.autoModReason}}): </span>
                            <span ng-if="!$ctrl.respondedToAutoMod">
                                <a href style="font-weight: 700;" ng-click="$ctrl.allowAutoModMessage()">Allow</a>
                                <span> • </span>
                                <a href style="font-weight: 700;" ng-click="$ctrl.denyAutoModMessage()">Deny</a>
                            </span>
                            <span ng-if="$ctrl.respondedToAutoMod" class="muted">
                                Sending...
                            </span>
                        </div>
                        <div ng-if="$ctrl.message.autoModStatus === 'PENDING' && $ctrl.message.autoModErrorMessage">
                            <span style="color: rgb(255 149 149)">{{$ctrl.message.autoModErrorMessage}}</span>
                        </div>
                        <div ng-if="['ALLOWED', 'DENIED'].includes($ctrl.message.autoModStatus)">
                            <span>{{$ctrl.message.autoModStatus === 'ALLOWED' ? 'Allowed' : 'Denied'}} by {{$ctrl.message.autoModResolvedBy}}</span>
                        </div>
                        <div ng-if="$ctrl.message.autoModStatus === 'EXPIRED'">
                            <span>Expired</span>
                        </div>
                    </div>
                    <div ng-if="$ctrl.message.isAnnouncement || $ctrl.message.isFirstChat || $ctrl.message.isReturningChatter || $ctrl.message.isRaider || $ctrl.message.isSuspiciousUser" style="margin-bottom:5px">
                </div>
            `,
            controller: function(chatMessagesService, utilityService, connectionService, pronounsService, backendCommunicator) {

                const $ctrl = this;

                $ctrl.pronouns = pronounsService;

                $ctrl.respondedToAutoMod = false;

                $ctrl.allowAutoModMessage = () => {
                    if ($ctrl.respondedToAutoMod) {
                        return;
                    }
                    $ctrl.respondedToAutoMod = true;
                    backendCommunicator.fireEvent("process-automod-message", { messageId: $ctrl.message.id, allow: true });
                };

                $ctrl.denyAutoModMessage = () => {
                    if ($ctrl.respondedToAutoMod) {
                        return;
                    }
                    $ctrl.respondedToAutoMod = true;
                    backendCommunicator.fireEvent("process-automod-message", { messageId: $ctrl.message.id, allow: false });
                };

                $ctrl.showUserDetailsModal = (userId) => {
                    if (userId == null) {
                        return;
                    }

                    const closeFunc = () => {};
                    utilityService.showModal({
                        component: "viewerDetailsModal",
                        backdrop: true,
                        resolveObj: {
                            userId: () => userId
                        },
                        closeCallback: closeFunc,
                        dismissCallback: closeFunc
                    });
                };

                function updateChatField(text) {
                    if (!$ctrl.updateChatInput) {
                        return;
                    }
                    $ctrl.updateChatInput({
                        text: text
                    });
                }

                $ctrl.replyBannerClicked = () => {
                    if (!$ctrl.onReplyClicked) {
                        return;
                    }
                    $ctrl.onReplyClicked({
                        threadOrReplyMessageId: $ctrl.message.threadParentMessageId || $ctrl.message.replyParentMessageId
                    });
                };

                $ctrl.getMessageContextMenu = (message) => {
                    const actions = [];

                    actions.push({
                        name: "Details",
                        icon: "fa-info-circle"
                    });

                    actions.push({
                        name: "Delete Message",
                        icon: "fa-trash-alt"
                    });

                    actions.push({
                        name: "Mention",
                        icon: "fa-at"
                    });

                    actions.push({
                        name: "Reply To Message",
                        icon: "fa-reply"
                    });

                    actions.push({
                        name: "Quote Message",
                        icon: "fa-quote-right"
                    });

                    if (message.username.toLowerCase() !== connectionService.accounts.streamer.username.toLowerCase() &&
                        message.username.toLowerCase() !== connectionService.accounts.bot.username.toLowerCase()) {

                        actions.push({
                            name: "Whisper",
                            icon: "fa-envelope"
                        });

                        actions.push({
                            name: "Spotlight Message",
                            icon: "fa-lightbulb-on"
                        });

                        actions.push({
                            name: "Shoutout",
                            icon: "fa-megaphone"
                        });

                        if (message.roles.includes("mod")) {
                            actions.push({
                                name: "Unmod",
                                icon: "fa-user-times"
                            });
                        } else {
                            actions.push({
                                name: "Mod",
                                icon: "fa-user-plus"
                            });

                            if (message.roles.includes("vip")) {
                                actions.push({
                                    name: "Remove VIP",
                                    icon: "fa-gem"
                                });
                            } else {
                                actions.push({
                                    name: "Add as VIP",
                                    icon: "fa-gem"
                                });
                            }
                        }

                        actions.push({
                            name: "Timeout",
                            icon: "fa-clock"
                        });

                        actions.push({
                            name: "Ban",
                            icon: "fa-ban"
                        });
                    }

                    return [
                        {
                            html: `<div class="name-wrapper">
                                    <img class="user-avatar" src="${message.profilePicUrl}">
                                    <span style="margin-left: 10px" class="user-name">${message.userDisplayName}${message.username && message.username.toLowerCase() !== message.userDisplayName.toLowerCase() ? ` (${message.username})` : ""}</span>
                                </div>`,
                            enabled: false
                        },
                        ...actions.map((a) => {
                            let html = "";
                            if (a.name === "Remove VIP") {
                                html = `
                                    <div class="message-action">
                                        <span class="fa-stack fa-1x mr-3" style="width: 18px">
                                            <i class="fad fa-gem fa-stack-1x ml-px mt-1" style="opacity: 0.5"></i>
                                            <i class="far fa-slash fa-stack-1x text-2xl"></i>
                                        </span>
                                        <span class="action-name">${a.name}</span>
                                    </div>
                                `;
                            } else {
                                html = `
                                    <div class="message-action">
                                        <span class="action-icon"><i class="fad ${a.icon}"></i></span>
                                        <span class="action-name">${a.name}</span>
                                    </div>
                                `;
                            }
                            return {
                                html: html,
                                click: () => {
                                    $ctrl.messageActionSelected(a.name, message.username, message.userId, message.displayName, message.id, message.rawText);
                                }
                            };
                        })];
                };

                $ctrl.messageActionSelected = (action, username, userId, displayName, msgId, rawText) => {
                    switch (action.toLowerCase()) {
                        case "delete message":
                            chatMessagesService.deleteMessage(msgId);
                            break;
                        case "timeout":
                            updateChatField(`/timeout @${username} 300`);
                            break;
                        case "ban":
                            utilityService
                                .showConfirmationModal({
                                    title: "Ban User",
                                    question: `Are you sure you want to ban ${username}?`,
                                    confirmLabel: "Ban",
                                    confirmBtnType: "btn-danger"
                                })
                                .then((confirmed) => {
                                    if (confirmed) {
                                        backendCommunicator.fireEvent("update-user-banned-status", { username: username, shouldBeBanned: true });
                                    }
                                });
                            break;
                        case "mod":
                            chatMessagesService.changeModStatus(username, true);
                            break;
                        case "unmod":
                            utilityService
                                .showConfirmationModal({
                                    title: "Mod User",
                                    question: `Are you sure you want to unmod ${username}?`,
                                    confirmLabel: "Unmod",
                                    confirmBtnType: "btn-danger"
                                })
                                .then((confirmed) => {
                                    if (confirmed) {
                                        chatMessagesService.changeModStatus(username, false);
                                    }
                                });
                            break;
                        case "add as vip":
                            backendCommunicator.fireEvent("update-user-vip-status", { username: username, shouldBeVip: true });
                            break;
                        case "remove vip":
                            backendCommunicator.fireEvent("update-user-vip-status", { username: username, shouldBeVip: false });
                            break;
                        case "whisper":
                            updateChatField(`/w @${username} `);
                            break;
                        case "mention":
                            updateChatField(`@${username} `);
                            break;
                        case "reply to message":
                            $ctrl.onReplyClicked({
                                threadOrReplyMessageId: $ctrl.message.id
                            });
                            break;
                        case "quote message":
                            updateChatField(`!quote add @${username} ${rawText}`);
                            break;
                        case "spotlight message":
                            chatMessagesService.highlightMessage(username, userId, displayName, rawText);
                            break;
                        case "shoutout":
                            updateChatField(`!so @${username}`);
                            break;
                        case "details": {
                            $ctrl.showUserDetailsModal(userId);
                            break;
                        }
                        default:
                            return;
                    }
                };

                $ctrl.$onInit = () => {
                };

                /*
                    $scope.getWhisperData = function(data) {
                        let target = data.target;
                        return "Whispered to " + target + ".";
                    };
                */

            }
        });
}());
