'use strict';

// Basic template for a modal component, copy this and rename to build a modal.

(function() {
    angular
        .module('firebotApp')
        .component("patronageDetailsModal", {
            template: `
            <div class="modal-header" style="text-align: center;">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Spark Patronage</h4>
            </div>
            <div class="modal-body">

                <div style="display:flex;justify-content: center; margin: 15px 0;text-align: center;">
                    <div>
                        <div style="font-size:22px">{{$ctrl.getTimeRemaining()}}</div>
                        <div class="muted" style="font-size:13px">Time Left</div>
                    </div>

                    <div style="margin-left: 55px;">
                        <div style="font-size:22px; width: 145px;">
                            <i class="fas fa-bolt" style="font-size: 22px;"></i>
                            <span count-up reanimate-on-click="false" end-val="$ctrl.getTotalPatronageEarned()" duration="1"></span>
                        </div>
                        <div class="muted" style="font-size:13px">Sparks Raised</div>
                    </div>                    
                </div>

                <div style="display:flex;position:relative;"> 

                    <div style="display: flex;align-items: center;font-size: 25px;width:25px;">
                        <!--<i class="fal fa-chevron-left clickable"></i>-->
                    </div>

                    <div style="display:flex;position:relative;width:100%;margin-left:5px;">
                        

                        <div style="position:relative;transform: translate(20px, 19px);z-index: 100;">
                            <img ng-src="{{$ctrl.getFilledVesselImageUrl()}}" style="height: 225px;width:70px;"></img>
                            <div style="height:225px;width:70px;position:absolute;top:0;left:0;">
                                <div class="animated-height" style="height:{{$ctrl.getReversedVesselCompletedPercentage()}}%;overflow:hidden;">
                                    <img ng-src="{{$ctrl.getVesselImageUrl()}}" style="height: 225px;width:70px;"></img>
                                </div>
                            </div>
                        </div>

                        <div ng-repeat="milestone in $ctrl.getMilestones() | orderBy:'-id' track by milestone.id" class="milestone" style="margin-top:{{$ctrl.getMilestonePadding($index)}}px;">
                            <hr>
                            <span class="detail">
                                <div ng-class="{muted: !$ctrl.milestoneIsCompleted(milestone.id)}">
                                    <span style="font-size: 13px;">
                                        <i class="fas fa-bolt"></i>
                                    </span>
                                    <span>{{ milestone.target | number}}</span>
                                    <span style="color:{{$ctrl.getBackgroundGradientA()}};width:16px;display: inline-block;padding-top: 0px;"><i ng-show="$ctrl.milestoneIsCompleted(milestone.id)" class="animated bounceIn far fa-check-circle" style="animation-delay: 0.{{ 9 - $index * 3}}s;"></i></span>
                                </div>
                                <div class="subtext">{{'$' + (milestone.reward / 100)}}</div>
                            </span>
                        </div>
                    </div>

                    <div style="display: flex;align-items: center;font-size: 25px;width:25px;">
                        <!--<i class="fal fa-chevron-right clickable"></i>-->
                    </div>

                </div>
                <div style="display:flex;justify-content: center;margin-top:45px;text-align: center;">
                    <div>
                        <div class="muted" style="font-size:13px">Total Rewards Earned</div>
                        <div style="font-size:25px">{{'$' + $ctrl.getTotalRewardsEarned()}} / {{'$' + $ctrl.getTotalRewardsInPeriod()}}</div> 
                    </div>
                </div>
                
            </div>
            `,
            bindings: {
                resolve: '<',
                close: '&',
                dismiss: '&'
            },
            controller: function(patronageService, $timeout) {
                let $ctrl = this;

                const defaultVesselImg = "https://static.mixer.com/img/design/ui/spark-crystal/001_crystal/001_crystal_empty.png";
                const defaultVesselFilledImg = "https://static.mixer.com/img/design/ui/spark-crystal/001_crystal/001_crystal_filled.png";

                let pausePercentage = true;
                $ctrl.getReversedVesselCompletedPercentage = () => {
                    if (pausePercentage) return 100;
                    return 100 - patronageService.percentageOfCurrentMilestoneGroup;
                };

                $ctrl.$onInit = () => {
                    $timeout(() => {
                        pausePercentage = false;
                    }, 100);
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

                function pad(s) {
                    return s.toString().padStart(2, "0");
                }

                $ctrl.getTimeRemaining = () => {
                    if (patronageService.dataLoaded) {
                        let now = new Date();
                        let reset = new Date(patronageService.patronageData.period.endTime);

                        const duration = reset.getTime() - now.getTime();
                        const days = parseInt(duration / 1000 / 60 / 60 / 24);
                        const hours = parseInt(duration / 1000 / 60 / 60);
                        const h = hours - days * 24;
                        const minutes = parseInt(duration / 1000 / 60);
                        const m = minutes - hours * 60;
                        const seconds = parseInt(duration / 1000);
                        const s = seconds - minutes * 60;

                        if (days < 1) {
                            return `${pad(h)}:${pad(m)}:${pad(s)}`;
                        }

                        return `${days}d, ${h}h${
                            m > 0 ? `, ${m}m` : ""
                        }`;
                    }
                    return "Unknown";
                };

                $ctrl.getTotalPatronageEarned = () => {
                    if (patronageService.dataLoaded) {
                        return patronageService.patronageData.channel.patronageEarned;
                    }
                    return 0;
                };

                $ctrl.getMilestones = () => {
                    return patronageService.getCurrentMilestoneGroup().milestones;
                };

                $ctrl.getTotalRewardsEarned = () => {
                    let totalReward = 0;
                    if (patronageService.dataLoaded) {
                        let channelData = patronageService.patronageData.channel,
                            periodData = patronageService.patronageData.period;

                        let currentMilestoneGroupId = channelData.currentMilestoneGroupId;

                        for (let milestoneGroup of periodData.milestoneGroups) {
                            if (milestoneGroup.id > currentMilestoneGroupId) break;
                            for (let milestone of milestoneGroup.milestones) {
                                if (channelData.patronageEarned >= milestone.target) {
                                    if (milestone.incrementalReward) {
                                        totalReward += milestone.incrementalReward;
                                    }
                                }
                            }
                        }
                    }
                    return totalReward / 100;
                };

                $ctrl.getTotalRewardsInPeriod = () => {
                    let totalReward = 0;
                    if (patronageService.dataLoaded) {
                        let periodData = patronageService.patronageData.period;

                        for (let milestoneGroup of periodData.milestoneGroups) {
                            for (let milestone of milestoneGroup.milestones) {
                                if (milestone.incrementalReward) {
                                    totalReward += milestone.incrementalReward;
                                }
                            }
                        }
                    }
                    return totalReward / 100;
                };

                $ctrl.milestoneIsCompleted = (milestoneId) => {
                    let channelData = patronageService.patronageData.channel;
                    let milestone = $ctrl.getMilestones().find(m => m.id === milestoneId);
                    if (milestone) {
                        return milestone.target <= channelData.patronageEarned;
                    }

                    return false;
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
            }
        });
}());
