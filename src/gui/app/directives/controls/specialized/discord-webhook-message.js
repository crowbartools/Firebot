"use strict";

(function() {
    angular
        .module('firebotApp')
        .component('discordWebhookMessage', {
            bindings: {
                effect: "=",
                isScreenshot: "<"
            },
            //language=HTML
            template: `
                <eos-container header="Discord Message" pad-top="true">
                    <textarea ng-model="effect.message" class="form-control" name="text" placeholder="Enter message" rows="4" cols="40" replace-variables></textarea>

                    <label class="control-fb control--checkbox" style="margin-top:15px"> Include rich embed
                        <input type="checkbox" ng-model="effect.includeEmbed">
                        <div class="control__indicator"></div>
                    </label>

                    <div ng-show="effect.includeEmbed">
                        <dropdown-select options="embedOptions" selected="effect.embedType"></dropdown-select>

                        <div ng-show="effect.embedType" style="margin-top:10px;">
                            <color-picker-input model="effect.embedColor" label="Embed Color"></color-picker-input>
                        </div>

                        <div ng-show="effect.embedType === 'custom'">

                            <div style="margin-top:10px;">
                                <firebot-input input-title="Title" model="effect.customEmbed.title"></firebot-input>
                            </div>

                            <div style="margin-top:10px;">
                                <firebot-input input-title="URL" model="effect.customEmbed.url"></firebot-input>
                            </div>

                            <div style="margin-top:10px;">
                                <firebot-input input-title="Content" use-text-area="true" model="effect.customEmbed.description"></firebot-input>
                            </div>

                            <div style="margin-top:10px;">
                                <firebot-input input-title="Author Name" model="effect.customEmbed.authorName"></firebot-input>
                            </div>

                            <div style="margin-top:10px;">
                                <firebot-input input-title="Author Icon URL" model="effect.customEmbed.authorIconUrl"></firebot-input>
                            </div>

                            <div ng-hide="$ctrl.isScreenshot" style="margin-top:10px;">
                                <firebot-input input-title="Image URL" model="effect.customEmbed.imageUrl"></firebot-input>
                            </div>

                        </div>

                        <div ng-show="effect.embedType === 'channel'">
                            <br /><b>*</b> Must be live for this to post.
                        </div>
                    </div>
                </eos-container>
            `,
            controller: function($scope) {
                const $ctrl = this;
                $ctrl.$onInit = () => {
                    $scope.effect = $ctrl.effect;

                    if ($ctrl.isScreenshot) {
                        $scope.embedOptions = {
                            stream: "Channel Details",
                            custom: "Custom Embed"
                        };
                    } else {
                        $scope.embedOptions = {
                            channel: "Channel Details",
                            custom: "Custom Embed"
                        };
                    }

                    if ($scope.effect.embedType == null) {
                        $scope.effect.embedType = $ctrl.isScreenshot ? "stream" : "channel";
                    }

                    if ($scope.effect.customEmbed == null) {
                        $scope.effect.customEmbed = {};
                    }
                    if ($scope.effect.embedColor == null) {
                        $scope.effect.embedColor = "#21b9ed";
                    }
                };
            }
        });
}());