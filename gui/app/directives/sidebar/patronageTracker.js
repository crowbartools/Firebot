'use strict';

(function() {
    angular
        .module('firebotApp')
        .component("patronageTracker", {
            template: `
            <div class="connection-status-wrapper" style="height: 70px;padding:0;">
                <div style="display:flex; align-items:center;height: 100%;">
                    <div class="clickable" style="position:relative;margin-left:22px;" uib-tooltip-html="$ctrl.getCurrentVesselTooltip()" tooltip-placement="right" tooltip-append-to-body="true" ng-click="$ctrl.showPatronageDetailsModal()">
                        <img ng-src="{{$ctrl.getFilledVesselImageUrl()}}" style="height: 45px;object-fit: scale-down;"></img>
                        <div style="height:45px;position:absolute;top:0;left:0;">
                            <div style="height:{{$ctrl.getReversedVesselCompletedPercentage()}}%;overflow:hidden;">
                                <img ng-src="{{$ctrl.getVesselImageUrl()}}" style="height: 45px;filter: grayscale(50%);"></img>
                            </div>
                        </div>
                    </div>
                    
                    <div ng-show="$ctrl.sbm.navExpanded" style="padding-left: 25px;display:flex; flex-direction:column; align-items: center;justify-content: center;">
                        <div style="color: white;opacity: 0.5;transition: 0.3s;font-size: 11px;text-transform: uppercase;padding-bottom: 3px;">
                            <span>Spark Patronage</span>
                        </div>
                        <div style="font-weight: 200;'Roboto Mono', monospace;width: 100px;height:22px;text-align: center;overflow: hidden;display:flex;justify-content:flex-start; transform: translate(-1px);">
                            <span id="patronageCount" style="color:#dadada;" count-up reanimate-on-click="false" end-val="$ctrl.getEarnedPatronage()" duration="0.2"></span>                    
                        </div>
                        <div class="clickable" style="height: 10px;width: 100%;margin-top: 6px;display: flex;align-items: center;" uib-tooltip-html="$ctrl.getCurrentMilestoneTooltip()" tooltip-append-to-body="true" ng-click="$ctrl.showPatronageDetailsModal()">
                            <div style="height: 2px;display: flex;width: 100%;position:relative;">
                                <span style="height:2px;background: #424242;display: inline-block;position:absolute;z-index:10;top: 0;right: 0;width:{{$ctrl.getReversedMilestoneCompletedPercentage()}}%;"></span>
                                <span style="position:absolute;height:2px;background: linear-gradient(to right, {{$ctrl.getBackgroundGradientA()}} 0%, {{$ctrl.getBackgroundGradientB()}} 100%);width: 100%;display: inline-block;"></span>
                            </div>
                        </div>     
                    </div>
                    <span ng-show="$ctrl.sbm.navExpanded" class="clickable" style="padding-left: 30px;font-size: 20px;color: gray;" ng-click="$ctrl.showPatronageDetailsModal()">
                        <i class="fal fa-chevron-right"></i>
                    </span>
                </div>
            </div>
            `,
            controller: function($rootScope, sidebarManager, patronageService, utilityService, $timeout) {
                let $ctrl = this;

                let BigText = require("big-text.js");

                $ctrl.sbm = sidebarManager;

                const defaultVesselImg = "https://static.mixer.com/img/design/ui/spark-crystal/001_crystal/001_crystal_empty.png";
                const defaultVesselFilledImg = "https://static.mixer.com/img/design/ui/spark-crystal/001_crystal/001_crystal_filled.png";
                const defaultGradientA = "#0279f0";
                const defaultGradientB = "#1fbaed";

                function addCommas(amount) {
                    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                }

                $ctrl.getReversedMilestoneCompletedPercentage = () => {
                    return 100 - patronageService.percentageToNextMilestone;
                };

                $ctrl.getReversedVesselCompletedPercentage = () => {
                    return 100 - patronageService.percentageOfCurrentMilestoneGroup;
                };

                $ctrl.getCurrentMilestoneTooltip = () => {
                    if (patronageService.dataLoaded) {
                        let percentage = patronageService.percentageToNextMilestone;
                        let currentMilestone = patronageService.getCurrentMilestone();
                        if (currentMilestone) {
                            return `<b>Current Milestone</b><br>${percentage}% Complete<br>(${addCommas(currentMilestone.target)} Sparks Needed)`;
                        }
                    }
                    return "";
                };

                $ctrl.getCurrentVesselTooltip = () => {
                    if (patronageService.dataLoaded) {
                        if (sidebarManager.navExpanded) {
                            return `Crystal is ${patronageService.percentageOfCurrentMilestoneGroup}% full`;
                        }
                        let milestonePercentage = patronageService.percentageToNextMilestone;
                        let currentMilestone = patronageService.getCurrentMilestone();
                        return `<b>Sparks Raised</b><br>
                        ${addCommas(patronageService.patronageData.channel.patronageEarned)}<br><br>
                        <b>Current Milestone</b><br>
                        ${milestonePercentage}% Complete<br>
                        (${addCommas(currentMilestone.target)} Sparks Needed)<br><br>
                        <b>Crystal</b><br>
                        ${patronageService.percentageOfCurrentMilestoneGroup}% full
                        `;

                    }
                    return "";
                };

                $ctrl.showPatronageDetailsModal = function() {
                    utilityService.showModal({
                        component: "patronageDetailsModal",
                        size: "sm",
                        animated: false
                    });
                };


                $ctrl.getVesselImageUrl = () => {
                    if (patronageService.dataLoaded) {
                        let periodData = patronageService.patronageData.period;
                        let channelData = patronageService.patronageData.channel;

                        let currentMilestoneGroupId = channelData.currentMilestoneGroupId;

                        if (periodData.milestoneGroups) {
                            let milestoneGroup = periodData.milestoneGroups.find(mg => mg.id === currentMilestoneGroupId);
                            if (milestoneGroup) {
                                return milestoneGroup.uiComponents.vesselImageEmptyPath;
                            }
                        }
                    }
                    return defaultVesselImg;
                };

                $ctrl.getFilledVesselImageUrl = () => {

                    if (patronageService.dataLoaded) {
                        let periodData = patronageService.patronageData.period;
                        let channelData = patronageService.patronageData.channel;

                        let currentMilestoneGroupId = channelData.currentMilestoneGroupId;
                        if (periodData.milestoneGroups) {
                            let milestoneGroup = periodData.milestoneGroups.find(mg => mg.id === currentMilestoneGroupId);
                            if (milestoneGroup) {
                                return milestoneGroup.uiComponents.vesselImageFullPath;
                            }
                        }
                    }

                    return defaultVesselFilledImg;
                };

                $ctrl.getBackgroundGradientA = () => {
                    if (patronageService.dataLoaded) {
                        let periodData = patronageService.patronageData.period;
                        let channelData = patronageService.patronageData.channel;

                        let currentMilestoneGroupId = channelData.currentMilestoneGroupId;

                        if (periodData.milestoneGroups) {
                            let milestoneGroup = periodData.milestoneGroups.find(mg => mg.id === currentMilestoneGroupId);
                            if (milestoneGroup) {
                                return milestoneGroup.uiComponents.backgroundGradientA;
                            }
                        }
                    }

                    return defaultGradientA;
                };

                $ctrl.getBackgroundGradientB = () => {
                    if (patronageService.dataLoaded) {
                        let periodData = patronageService.patronageData.period;
                        let channelData = patronageService.patronageData.channel;

                        let currentMilestoneGroupId = channelData.currentMilestoneGroupId;

                        if (periodData.milestoneGroups) {
                            let milestoneGroup = periodData.milestoneGroups.find(mg => mg.id === currentMilestoneGroupId);
                            if (milestoneGroup) {
                                return milestoneGroup.uiComponents.backgroundGradientB;
                            }
                        }
                    }

                    return defaultGradientB;
                };


                function recalcTextSize() {
                    $timeout(() => {
                        BigText("#patronageCount", {
                            fontSizeFactor: 0.9,
                            maximumFontSize: 22,
                            verticalAlign: "bottom"
                        });
                    }, 400);
                }

                $ctrl.getEarnedPatronageDisplay = () => {
                    let amount = 0;
                    if (patronageService.dataLoaded) {
                        amount = patronageService.patronageData.channel.patronageEarned;
                    }
                    return addCommas(amount);
                };

                $ctrl.getEarnedPatronage = () => {
                    let amount = 0;
                    if (patronageService.dataLoaded) {
                        amount = patronageService.patronageData.channel.patronageEarned;
                    }
                    return amount;
                };

                $rootScope.$on("patronageUpdated", () => {
                    recalcTextSize();
                });

                $rootScope.$on("navToggled", () => {
                    recalcTextSize();
                });

                recalcTextSize();

                $timeout(() => {
                    recalcTextSize();
                }, 500);
            }
        });
}());