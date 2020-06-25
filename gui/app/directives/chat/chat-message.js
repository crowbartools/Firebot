"use strict";
(function() {
    angular
        .module('firebotApp')
        .component("chatMessage", {
            bindings: {
                message: "=",
                compactDisplay: "<",
                hideDeletedMessages: "<"
            },
            template: `
                <div class="chat-message" 
                    ng-class="{ isAction: $ctrl.message.action, isWhisper: $ctrl.message.whisper, isDeleted: $ctrl.message.deleted, isTagged: $ctrl.message.tagged, isCompact: $ctrl.compactDisplay, spoilers: $ctrl.hideDeletedMessages }" 
                    ng-attr-messageId="{{$ctrl.message.id}}">
                    <div class="chat-user-avatar-wrapper" on-action-selected="messageActionSelected(actionName, userName, userId, msgId)">
                        <span>
                            <img class="chat-user-avatar" ng-src="{{$ctrl.message.profilePicUrl}}">
                        </span>                 
                    </div>
                    <div style="padding-left: 10px">
                        <div class="chat-username"  ng-style="{'color': $ctrl.message.color}"  message="$ctrl.message" on-action-selected="messageActionSelected(actionName, userName, userId, msgId)">
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
            controller: function(utilityService) {

                const $ctrl = this;

                $ctrl.$onInit = () => {
                    debugger;
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
