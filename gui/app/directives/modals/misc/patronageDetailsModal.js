'use strict';

// Basic template for a modal component, copy this and rename to build a modal.

(function() {
    angular
        .module('firebotApp')
        .component("patronageDetailsModal", {
            template: `
            <div class="modal-header" style="text-align: center;">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Patronage Details</h4>
            </div>
            <div class="modal-body">

                <div>
                    <div style="display:flex;position:relative;margin-left: 25px;">

                        <div style="position:relative;transform: translate(20px, 19px);z-index: 100;">
                            <img ng-src="{{$ctrl.getFilledVesselImageUrl()}}" style="height: 225px;width:70px;"></img>
                            <div style="height:225px;width:70px;position:absolute;top:0;left:0;">
                                <div style="height:{{$ctrl.getReversedVesselCompletedPercentage()}}%;overflow:hidden;">
                                    <img ng-src="{{$ctrl.getVesselImageUrl()}}" style="height: 225px;width:70px;"></img>
                                </div>
                            </div>
                        </div>

                        <div ng-repeat="milestone in $ctrl.getMilestones() | orderBy:'-id' track by milestone.id" class="milestone" style="margin-top:{{$ctrl.getMilestonePadding($index)}}px;">
                            <hr>
                            <span>
                                <div ng-class="{muted: !$ctrl.milestoneIsCompleted(milestone.id)}">
                                    <span style="font-size: 13px;">
                                        <i class="fas fa-bolt"></i>
                                    </span>
                                    <span>{{ milestone.target | number}}</span>
                                    <span style="color:{{$ctrl.getBackgroundGradientA()}};width:16px;display: inline-block;padding-top: 0px;"><i ng-show="$ctrl.milestoneIsCompleted(milestone.id)" class="far fa-check-circle"></i></span>
                                </div>
                                <div class="subtext">{{'$' + (milestone.reward / 100)}}</div>
                            </span>
                        </div>

                    </div>
                </div>
                
            </div>
            <div class="modal-footer">
            </div>
            `,
            bindings: {
                resolve: '<',
                close: '&',
                dismiss: '&'
            },
            controller: function(patronageService) {
                let $ctrl = this;

                const defaultVesselImg = "https://static.mixer.com/img/design/ui/spark-crystal/001_crystal/001_crystal_empty.png";
                const defaultVesselFilledImg = "https://static.mixer.com/img/design/ui/spark-crystal/001_crystal/001_crystal_filled.png";

                $ctrl.getReversedVesselCompletedPercentage = () => {
                    return 100 - patronageService.percentageOfCurrentMilestoneGroup;
                };

                $ctrl.getMilestonePadding = (index) => {
                    let milestones = $ctrl.getMilestones();
                    if (milestones.length > 0) {
                        // 225 = the height of the crystal in pixels
                        let divided = 225 / milestones.length;
                        return divided * index;
                    }
                    return 0;
                };

                $ctrl.getMilestones = () => {
                    return patronageService.getCurrentMilestoneGroup().milestones;
                };

                $ctrl.milestoneIsCompleted = (milestoneId) => {
                    let channelData = patronageService.patronageData.channel;
                    return milestoneId < channelData.currentMilestoneId;
                };

                const defaultGradientA = "#0279f0";
                $ctrl.getBackgroundGradientA = () => {
                    if (patronageService.dataLoaded) {
                        let periodData = patronageService.patronageData.period;
                        let channelData = patronageService.patronageData.channel;

                        let currentMilestoneGroupId = channelData.currentMilestoneGroupId;

                        let milestoneGroup = periodData.milestoneGroups.find(mg => mg.id === currentMilestoneGroupId);
                        if (milestoneGroup) {
                            return milestoneGroup.uiComponents.backgroundGradientA;
                        }
                    }

                    return defaultGradientA;
                };

                $ctrl.getVesselImageUrl = () => {
                    if (patronageService.dataLoaded) {
                        let periodData = patronageService.patronageData.period;
                        let channelData = patronageService.patronageData.channel;

                        let currentMilestoneGroupId = channelData.currentMilestoneGroupId;

                        let milestoneGroup = periodData.milestoneGroups.find(mg => mg.id === currentMilestoneGroupId);
                        if (milestoneGroup) {
                            return milestoneGroup.uiComponents.vesselImageEmptyPath;
                        }
                    }
                    return defaultVesselImg;
                };

                $ctrl.getFilledVesselImageUrl = () => {

                    if (patronageService.dataLoaded) {
                        let periodData = patronageService.patronageData.period;
                        let channelData = patronageService.patronageData.channel;

                        let currentMilestoneGroupId = channelData.currentMilestoneGroupId;

                        let milestoneGroup = periodData.milestoneGroups.find(mg => mg.id === currentMilestoneGroupId);
                        if (milestoneGroup) {
                            return milestoneGroup.uiComponents.vesselImageFullPath;
                        }
                    }

                    return defaultVesselFilledImg;
                };

                $ctrl.$onInit = function () {
                    // When the compontent is initialized
                    // This is where you can start to access bindings, such as variables stored in 'resolve'
                    // IE $ctrl.resolve.shouldDelete or whatever
                };
            }
        });
}());
