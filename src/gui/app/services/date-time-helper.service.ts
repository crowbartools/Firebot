"use strict";

import { DateTime } from "luxon";
import type { DateTimeHelper } from "../../../types";

(function() {
    // @ts-ignore
    angular
        .module("firebotApp")
        .factory("dateTimeHelper", function() {
            const service = {} as DateTimeHelper;

            service.formatDate = (ISOdate: string, format: string) => {
                const date = DateTime.fromISO(ISOdate);

                return date.toFormat(format);
            };

            service.getFirstWeekDayDate = () => {
                const date = DateTime.now();

                return date.startOf("week").toISODate();
            };

            service.getLastWeekDayDate = () => {
                const date = DateTime.now();

                return date.endOf("week").toISODate();
            };

            return service;
        });
}());
