"use strict";
(function() {
    angular
        .module('firebotApp')
        .component("chatMessage", {
            bindings: {
                message: "=",
                compactDisplay: "<",
                hideDeletedMessages: "<",
                updateChatInput: "&"
            },
            template: `
                <div class="chat-message" 
                    ng-class="{ isAction: $ctrl.message.action, isWhisper: $ctrl.message.whisper, isDeleted: $ctrl.message.deleted, isTagged: $ctrl.message.tagged, isCompact: $ctrl.compactDisplay, spoilers: $ctrl.hideDeletedMessages, isHighlighted: $ctrl.message.isHighlighted, isCustomReward: $ctrl.message.customRewardId != null }" 
                    ng-attr-messageId="{{$ctrl.message.id}}">
                    <div class="chat-user-avatar-wrapper" message-actions message="$ctrl.message" on-action-selected="$ctrl.messageActionSelected(actionName, userName, userId, msgId)">
                        <span>
                            <img class="chat-user-avatar" ng-src="{{$ctrl.message.profilePicUrl}}">
                        </span>                 
                    </div>
                    <div style="padding-left: 10px">
                        <div class="chat-username" ng-style="{'color': $ctrl.message.color}" message-actions message="$ctrl.message" on-action-selected="$ctrl.messageActionSelected(actionName, userName, userId, msgId)">
                            <span ng-show="$ctrl.message.badges.length > 0" class="user-badges">
                                <img ng-repeat="badge in $ctrl.message.badges" 
                                    ng-src="{{badge.url}}"
                                    uib-tooltip="{{badge.title}}" 
                                    tooltip-append-to-body="true">
                            </span>
                            <b>{{$ctrl.message.username}}</b>
                            <span ng-if="!$ctrl.compactDisplay" class="muted chat-timestamp">
                                {{$ctrl.message.timestampDisplay}}
                            </span>
                        </div>
                        <div class="chatContent">
                            <span ng-repeat="part in $ctrl.message.parts" class="chat-content-wrap">

                                <span ng-if="part.type === 'text'">{{part.text}}</span>

                                <span ng-if="part.type === 'emote'" class="chatEmoticon">
                                    <img ng-src="{{part.url}}">
                                </span>

                            </span>
                        </div>
                    </div>
                </div>
            `,
            controller: function(chatMessagesService, utilityService) {

                const $ctrl = this;

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

                $ctrl.messageActionSelected = (action, userName, userId, msgId) => {
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
