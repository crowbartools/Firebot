"use strict";

import type { BackendCommunicator, StreamScheduleService } from "../../../types";

interface StreamSchedule {
    segments: Array<{
        id: string;
        startDate: Date;
        endDate: Date;
        title: string;
        cancelEndDate: Date;
        categoryId: string;
        categoryName: string;
        categoryImage: string;
        isRecurring: boolean;
    }>;
    settings: {
        vacation: {
            startDate: Date;
            endDate: Date;
        }
    }
}

(function() {
    // @ts-ignore
    angular
        .module("firebotApp")
        .factory("streamScheduleService", function(backendCommunicator: BackendCommunicator) {
            const service = {} as StreamScheduleService;

            service.streamSchedule = {};

            service.loadStreamSchedule = () => {
                backendCommunicator.fireEventAsync<StreamSchedule>("get-stream-schedule").then((streamSchedule) => {
                    service.streamSchedule = streamSchedule;
                }).catch((err) => {
                    console.error("Error getting stream schedule:", err);
                });
            };

            service.getStreamSchedule = () => {
                return service.streamSchedule;
            }

            return service;
        });
}());
