"use strict";

(function() {
    //This a wrapped dropdown element that automatically handles the particulars

    angular
        .module('firebotApp')
        .component("chatterSelect", {
            bindings: {
                model: "="
            },
            template: `
            <div>
                <dropdown-select options="$ctrl.chatters" selected="$ctrl.model"></dropdown-select>
            </div>
            `,
            controller: function(accountAccess) {
                const $ctrl = this;

                $ctrl.chatters = ['Streamer'];
                if (accountAccess.accounts.bot.loggedIn) {
                    $ctrl.chatters.push("Bot");
                }

                $ctrl.$onInit = () => {
                    if ($ctrl.model == null) {
                        if (accountAccess.accounts.bot.loggedIn) {
                            $ctrl.model = "Bot";
                        } else {
                            $ctrl.model = "Streamer";
                        }
                    }
                };
            }
        });
}());
