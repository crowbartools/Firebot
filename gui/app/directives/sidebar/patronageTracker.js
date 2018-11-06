'use strict';

(function() {
    angular
        .module('firebotApp')
        .component("patronageTracker", {
            template: `
            <div class="connection-status-wrapper" style="height: 70px;padding:0;">
                <div style="display:flex; align-items:center;height: 100%;">
                    <div style="position:relative;margin-left:22px;">
                        <img ng-src="{{$ctrl.getFilledVesselImageUrl()}}" style="height: 45px;object-fit: scale-down;"></img>
                        <div style="height:45px;position:absolute;top:0;left:0;">
                            <div style="height:{{$ctrl.getReversedVesselCompletedPercentage()}}%;overflow:hidden;">
                                <img ng-src="{{$ctrl.getVesselImageUrl()}}" style="height: 45px;"></img>
                            </div>
                        </div>
                    </div>
                    
                    <div ng-show="$ctrl.sbm.navExpanded" style="padding-left: 25px;display:flex; flex-direction:column; align-items: center;justify-content: center;">
                        <div style="color: white;opacity: 0.5;transition: 0.3s;font-size: 11px;text-transform: uppercase;padding-bottom: 3px;">
                            <span>Spark Patronage</span>
                        </div>
                        <div style="font-weight: 200;'Roboto Mono', monospace;width: 100px;height:22px;text-align: center;overflow: hidden;display:flex;justify-content:flex-start; transform: translate(-1px);">
                            <span id="patronageCount" count-up reanimate-on-click="false" end-val="$ctrl.getEarnedPatronage()" duration="0.2"></span>                    
                        </div>
                        <div style="height: 2px;display: flex;width: 100%;margin-top: 10px;position:relative;">
                            <span style="height:2px;background: #424242;display: inline-block;position:absolute;z-index:10;top: 0;right: 0;width:{{$ctrl.getReversedMilestoneCompletedPercentage()}}%;"></span>
                            <span style="position:absolute;height:2px;background: linear-gradient(to right, {{$ctrl.getBackgroundGradientA()}} 0%, {{$ctrl.getBackgroundGradientB()}} 100%);width: 100%;display: inline-block;"></span>
                        </div>
                    </div>
                    <span ng-show="$ctrl.sbm.navExpanded" style="padding-left: 30px;font-size: 20px;color: gray;">
                        <i class="fal fa-chevron-right"></i>
                    </span>
                </div>
            </div>
            `,
            controller: function($rootScope, sidebarManager, patronageService, $timeout) {
                let $ctrl = this;

                let BigText = require("big-text.js");

                $ctrl.sbm = sidebarManager;

                const defaultVesselImg = "https://static.mixer.com/img/design/ui/spark-crystal/001_crystal/001_crystal_empty.png";
                const defaultVesselFilledImg = "https://static.mixer.com/img/design/ui/spark-crystal/001_crystal/001_crystal_filled.png";
                const defaultGradientA = "#0279f0";
                const defaultGradientB = "#1fbaed";

                $ctrl.getReversedMilestoneCompletedPercentage = () => {
                    return 100 - patronageService.percentageToNextMilestone;
                };

                $ctrl.getReversedVesselCompletedPercentage = () => {
                    return 100 - patronageService.percentageOfCurrentMilestoneGroup;
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

                $ctrl.getBackgroundGradientB = () => {
                    if (patronageService.dataLoaded) {
                        let periodData = patronageService.patronageData.period;
                        let channelData = patronageService.patronageData.channel;

                        let currentMilestoneGroupId = channelData.currentMilestoneGroupId;

                        let milestoneGroup = periodData.milestoneGroups.find(mg => mg.id === currentMilestoneGroupId);
                        if (milestoneGroup) {
                            return milestoneGroup.uiComponents.backgroundGradientB;
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
                    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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