"use strict";

(function() {

    const { v4: uuid } = require("uuid");

    angular.module("firebotApp")
        .component("addOrEditDiscordWebhookModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Discord Channel</h4>
            </div>
            <div class="modal-body">

                <div>
                    <div class="modal-subheader" style="padding: 0 0 4px 0">
                        Name
                    </div>
                    <div style="width: 100%; position: relative;">
                        <div class="form-group" ng-class="{'has-error': $ctrl.nameError}">
                            <input type="text" id="nameField" class="form-control" ng-model="$ctrl.channel.name" ng-keyup="$event.keyCode == 13 && $ctrl.save() " aria-describedby="helpBlock" placeholder="Enter name">
                            <span id="helpBlock" class="help-block" ng-show="$ctrl.nameError">Please provide a name.</span>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 15px;">
                    <div class="modal-subheader" style="padding: 0 0 4px 0">
                        Webhook URL
                    </div>
                    <div style="width: 100%; position: relative;">
                        <div class="form-group" ng-class="{'has-error': $ctrl.urlError}">
                            <input type="text" id="urlField" class="form-control" ng-model="$ctrl.channel.webhookUrl" ng-keyup="$event.keyCode == 13 && $ctrl.save() " aria-describedby="urlHelpBlock" placeholder="Enter url">
                            <span id="urlHelpBlock" class="help-block" ng-show="$ctrl.urlError">Please provide a valid Discord Webhook URL</span>
                        </div>
                        <collapsable-section show-text="Where do I get the Webhook URL?" hide-text="Where do I get the Webhook URL?"  text-color="#0b8dc6">
                            <ol style="font-weight: 100;font-size: 15px;">
                                <li style="margin: 5px 0;">In Discord, open channel settings for the channel you want Firebot posting messages to <span class="muted">(click the Gear next to the channel name)</span></li>
                                <li style="margin: 5px 0;">Go to the <b>Integrations</b> tab</li>
                                <li style="margin: 5px 0;">Click <b>Create Webhook</b></li>
                                <li style="margin: 5px 0;">Give the webhook a name <span class="muted">(Optional. You'll likely want this to be your channel name or your bot accounts name. You can also set an override for this in Firebot)</span></li>
                                <li style="margin: 5px 0;">Upload an avatar image for the webhook <span class="muted">(Optional. You can also set an override for this in Firebot)</span></li>
                                <li style="margin: 5px 0;"><b>Copy</b> the Webhook URL at the bottom</li>
                                <li style="margin: 5px 0;">Click <b>Save</b> <span class="muted">(Important!)</span></li>
                                <li style="margin: 5px 0;">Paste that Webhook URL above!</li>
                            </ol>
                        </collapsable-section>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
            </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function($timeout) {
                const $ctrl = this;

                $timeout(() => {
                    angular.element("#nameField").trigger("focus");
                }, 50);


                $ctrl.channel = {
                    id: uuid(),
                    name: "",
                    webhookUrl: ""
                };

                $ctrl.$onInit = function() {
                    if ($ctrl.resolve.channel != null) {
                        $ctrl.channel = JSON.parse(JSON.stringify($ctrl.resolve.channel));
                    }
                };

                $ctrl.nameError = false;
                $ctrl.urlError = false;

                function validateName() {
                    const name = $ctrl.channel.name;
                    return name != null && name.length > 0;
                }

                function validateWebhookUrl() {
                    const discordWebhookRegex = /^https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/[^/\s]+\/[^/\s]+$/i;
                    const guildedWebhookRegex = /^https:\/\/media\.guilded?\.gg\/webhooks\/[^/\s]+\/[^/\s]+$/i;
                    const webhookUrl = $ctrl.channel.webhookUrl;
                    return webhookUrl != null && webhookUrl.length > 0 && (discordWebhookRegex.test(webhookUrl) || guildedWebhookRegex.test(webhookUrl));
                }

                $ctrl.save = function() {
                    $ctrl.nameError = false;
                    $ctrl.urlError = false;

                    if (!validateName()) {
                        $ctrl.nameError = true;
                    }

                    if (!validateWebhookUrl()) {
                        $ctrl.urlError = true;
                    }

                    if ($ctrl.nameError || $ctrl.urlError) {
                        return;
                    }

                    $ctrl.close({
                        $value: {
                            channel: $ctrl.channel
                        }
                    });
                };
            }
        });
}());
