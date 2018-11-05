'use strict';


(function() {

    angular
        .module('firebotApp')
        .factory('patronageService', function ($rootScope, logger, listenerService) {
            let service = {};

            service.dataLoaded = false;
            service.patronageData = {
                channel: null,
                period: null
            };

            service.percentageCompletedToNextMilestone = 0;
            service.percentageCompletedOfCurrentVessel = 0;


            function getPercentageToNextMilestone() {
                let percentCompleted = 0;

                if (service.dataLoaded) {
                    let periodData = service.patronageData.period;
                    let channelData = service.patronageData.channel;

                    let currentMilestoneGroupId = channelData.currentMilestoneGroupId;

                    let currentMilestoneId = channelData.currentMilestoneId;
                    let previousMilestoneId = channelData.currentMilestoneId - 1;

                    let milestoneGroup = periodData.milestoneGroups.find(mg => mg.id === currentMilestoneGroupId);
                    if (milestoneGroup) {
                        let currentMilestone = milestoneGroup.milestones.find(m => m.id === currentMilestoneId);

                        let previousTarget = 0;
                        let previousMilestone = milestoneGroup.milestones.find(m => m.id === previousMilestoneId);
                        if (previousMilestone) {
                            previousTarget = previousMilestone.target;
                        }

                        if (currentMilestone) {
                            let currentTarget = currentMilestone.target;

                            let patronageEarned = channelData.patronageEarned;
                            if (patronageEarned > currentTarget) {
                                percentCompleted = 100;
                            } else {
                                percentCompleted = ((patronageEarned - previousTarget) / (currentTarget - previousTarget)) * 100;
                            }
                        }
                    }
                }

                return Math.floor(percentCompleted);
            }

            function getPercentageOfCurrentVessel() {
                let percentCompleted = 0;

                if (service.dataLoaded) {
                    let periodData = service.patronageData.period;
                    let channelData = service.patronageData.channel;

                    let currentMilestoneGroupId = channelData.currentMilestoneGroupId;

                    let milestoneGroup = periodData.milestoneGroups.find(mg => mg.id === currentMilestoneGroupId);
                    if (milestoneGroup) {
                        let lastMilestone = milestoneGroup.milestones[milestoneGroup.milestones.length - 1];

                        if (lastMilestone) {

                            let targetBase = milestoneGroup.milestoneTargetBase;
                            let lastTarget = lastMilestone.target;

                            let patronageEarned = channelData.patronageEarned;

                            if (patronageEarned > lastTarget) {
                                percentCompleted = 100;
                            } else {
                                percentCompleted = (patronageEarned - targetBase) / (lastTarget - targetBase) * 100;
                            }
                        }
                    }
                }

                return Math.floor(percentCompleted);
            }

            service.recalucatePercentages = () => {
                service.percentageCompletedToNextMilestone = getPercentageToNextMilestone();
                service.percentageCompletedOfCurrentVessel = getPercentageOfCurrentVessel();
            };

            service.updateData = () => {
                service.patronageData = listenerService.fireEventSync("getPatronageData");
                service.dataLoaded = true;
                service.recalucatePercentages();
            };

            listenerService.registerListener(
                { type: listenerService.ListenerType.CHANNEL_PATRONAGE_UPDATE},
                (data) => {
                    service.patronageData.channel = data;
                    service.recalucatePercentages();
                    $rootScope.$broadcast("patronageUpdated");
                });


            service.updateData();

            return service;
        });
}(window.angular));
