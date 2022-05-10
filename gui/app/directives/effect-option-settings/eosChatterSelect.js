"use strict";
(function() {
    //This adds the <eos-chatter-select> element

    angular
        .module('firebotApp')
        .component("eosChatterSelect", {
            bindings: {
                title: "@",
                effect: '=',
                padTop: "<"
            },
            template: `
                <eos-container header="{{$ctrl.title}}" pad-top="$ctrl.padTop">
                    <div class="btn-group">
                        <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <span class="chat-effect-type">{{$ctrl.effect.chatter}}</span> <span class="caret"></span>
                        </button>
                        <ul class="dropdown-menu chat-effect-dropdown">
                            <li ng-click="$ctrl.effect.chatter = 'Streamer'"><a href>Streamer</a></li>
                            <li ng-if="$ctrl.botLoggedIn" ng-click="$ctrl.effect.chatter = 'Bot'"><a href>Bot</a></li>
                        </ul>
                    </div>
                </eos-container>
                `,
            controller: function(connectionService) {
                const ctrl = this;

                ctrl.botLoggedIn = connectionService.accounts.bot.loggedIn;

                ctrl.$onInit = function() {
                // Reset overlay instance to default (or null) if the saved instance doesnt exist anymore
                    if (ctrl.effect.chatter == null) {
                        if (ctrl.botLoggedIn) {
                            ctrl.effect.chatter = "Bot";
                        } else {
                            ctrl.effect.chatter = "Streamer";
                        }
                    }
                };
            }
        });
}());
