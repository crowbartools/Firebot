"use strict";
(function() {
    angular
        .module('firebotApp')
        .component("discordChannelWebhooks", {
            bindings: {
                model: "="
            },
            template: `
                <div>
                    <div ng-repeat="channel in $ctrl.model track by $index" style="margin-bottom: 4px;">
                        <div style="display:flex;height: 45px; align-items: center; justify-content: space-between;padding: 0 15px;background-color:#44474e;border-radius: 4px;">
                            <div style="font-weight: 100;font-size: 16px;">{{channel.name}}</div>
                            <div style="display: flex;align-items: center;justify-content: center;">
                                <button class="filter-bar" ng-click="$ctrl.editChannel($index)" style="margin: 0; margin-right: 13px;" aria-label="Add channel">Edit</button> 
                                <span class="delete-button" ng-click="$ctrl.removeChannel($index)">
                                    <i class="far fa-trash-alt"></i>
                                </span>
                            </div>     
                        </div>
                    </div>
                    <div>
                        <button class="filter-bar" ng-click="$ctrl.addChannel()" uib-tooltip="Add Channel" tooltip-append-to-body="true" aria-label="Add channel">
                            <i class="far fa-plus"></i> 
                        </button> 
                    </div>
                </div>
            `,
            controller: function(utilityService) {

                const $ctrl = this;


                $ctrl.$onInit = () => {
                    if ($ctrl.model == null) {
                        $ctrl.model = [];
                    }
                };

                function openAddOrEditChannelModal(channel, cb) {

                    utilityService.showModal({
                        component: "addOrEditDiscordWebhookModal",
                        size: 'sm',
                        resolveObj: {
                            channel: () => channel
                        },
                        closeCallback: resp => {
                            cb(resp.channel);
                        }
                    });
                }

                $ctrl.editChannel = (index) => {
                    openAddOrEditChannelModal($ctrl.model[index], (newChannel) => {
                        $ctrl.model[index] = newChannel;
                    });
                };

                $ctrl.addChannel = () => {
                    openAddOrEditChannelModal(null, (newChannel) => {
                        $ctrl.model.push(newChannel);
                    });
                };

                $ctrl.removeChannel = (index) => {
                    $ctrl.model.splice(index, 1);
                };

            }
        });
}());
