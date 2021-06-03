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
                showThirdPartyEmotes: "<",
                showPronoun: "<",
                updateChatInput: "&",
                chatSizeStyle: "@?"
            },
            template: `
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
                    context-menu-on="contextmenu"
                >
                    <div 
                        ng-if="!$ctrl.compactDisplay"
                        ng-show="$ctrl.showAvatar"
                        class="chat-user-avatar-wrapper" 
                        context-menu="$ctrl.getMessageContextMenu($ctrl.message)"
                        context-menu-on="click"
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
                            context-menu-on="click"
                        >
                            <img class="chat-user-avatar" ng-src="{{$ctrl.message.profilePicUrl}}">              
                        </div>

                        <div 
                            class="chat-username" 
                            context-menu="$ctrl.getMessageContextMenu($ctrl.message)"
                            context-menu-on="click"
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
                            <b ng-style="{'color': $ctrl.message.color}">{{$ctrl.message.username}}</b>
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

                                <span ng-if="part.type === 'text'" style="{{$ctrl.chatSizeStyle}}">{{part.text}}</span>

                                <a ng-if="part.type === 'link'" ng-href="{{part.url}}" target="_blank">{{part.text}}</a>

                                <span 
                                    ng-if="part.type === 'emote'" 
                                    class="chatEmoticon"
                                    uib-tooltip="{{part.origin}}: {{part.name}}"
                                    tooltip-append-to-body="true"
                                >
                                    <img ng-src="{{part.url}}" style="height: 100%;">
                                </span>

                                <span 
                                    ng-if="part.type === 'third-party-emote' && $ctrl.showThirdPartyEmotes" 
                                    class="chatEmoticon"
                                    uib-tooltip="{{part.origin}}: {{part.name}}"
                                    tooltip-append-to-body="true"
                                >
                                    <img ng-src="{{part.url}}" style="height: 100%;" />
                                </span>
                                <span ng-if="part.type === 'third-party-emote' && !$ctrl.showThirdPartyEmotes" style="{{$ctrl.chatSizeStyle}}">{{part.name}}</span>
                            </span>
                        </div>
                        <div ng-show="$ctrl.message.whisper" class="muted">(Whispered to you)</div>
                    </div>
                </div>
            `,
            controller: function(chatMessagesService, utilityService, connectionService, pronounsService) {

                const $ctrl = this;

                $ctrl.pronouns = pronounsService;

                $ctrl.showUserDetailsModal = (userId) => {
                    if (userId == null) return;
                    let closeFunc = () => {};
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
                    $ctrl.updateChatInput({
                        text: text
                    });
                }

                $ctrl.getMessageContextMenu = (message) => {
                    const actions = [];

                    actions.push({
                        name: "Details",
                        icon: "fa-info-circle"
                    });

                    actions.push({
                        name: "Delete",
                        icon: "fa-trash-alt"
                    });

                    actions.push({
                        name: "Mention",
                        icon: "fa-at"
                    });

                    if (message.username !== connectionService.accounts.streamer.username &&
                        message.username !== connectionService.accounts.bot.username) {

                        actions.push({
                            name: "Whisper",
                            icon: "fa-envelope"
                        });

                        actions.push({
                            name: "Quote This Message",
                            icon: "fa-quote-right"
                        });

                        actions.push({
                            name: "Highlight This Message",
                            icon: "fa-eye"
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
                                    <span style="margin-left: 10px" class="user-name">${message.username}</span>   
                                </div>`,
                            enabled: false
                        },
                        ...actions.map(a => ({
                            html: `
                                <div class="message-action">
                                    <span class="action-icon"><i class="fad ${a.icon}"></i></span>
                                    <span class="action-name">${a.name}</span>                               
                                </div>
                            `,
                            click: () => {
                                $ctrl.messageActionSelected(a.name, message.username, message.userId, message.id, message.rawText);
                            }
                        }))];
                };

                $ctrl.messageActionSelected = (action, userName, userId, msgId, rawText) => {
                    switch (action.toLowerCase()) {
                    case "delete":
                        chatMessagesService.deleteMessage(msgId);
                        break;
                    case "timeout":
                        updateChatField(`/timeout @${userName} 300`);
                        break;
                    case "ban":
                        updateChatField(`/ban @${userName}`);
                        break;
                    case "mod":
                        chatMessagesService.changeModStatus(userName, true);
                        break;
                    case "unmod":
                        chatMessagesService.changeModStatus(userName, false);
                        break;
                    case "whisper":
                        updateChatField(`/w @${userName} `);
                        break;
                    case "mention":
                        updateChatField(`@${userName} `);
                        break;
                    case "quote this message":
                        updateChatField(`!quote add @${userName} ${rawText}`);
                        break;
                    case "highlight this message":
                        chatMessagesService.highlightMessage(userName, rawText);
                        break;
                    case "shoutout":
                        updateChatField(`!so @${userName}`);
                        break;
                    case "details": {
                        $ctrl.showUserDetailsModal(userId);
                        break;
                    }
                    default:
                        return;
                    }
                };

                $ctrl.$onInit = () => {};

                /*
                    $scope.getWhisperData = function(data) {
                        let target = data.target;
                        return "Whispered to " + target + ".";
                    };
                */

            }
        });
}());
