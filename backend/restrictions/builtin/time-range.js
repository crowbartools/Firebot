"use strict";

const moment = require("moment");

const model = {
    definition: {
        id: "firebot:timeRange",
        name: "Time Range",
        description: "Restrict usage to a specific local time.",
        triggers: []
    },
    optionsTemplate: `
        <div>
            <div id="startTime" class="modal-subheader" style="padding: 0 0 4px 0">
                Start Time
            </div>
            <div uib-timepicker ng-model="restriction.startTime" show-spinners="false"></div>

            <div id="endTime" class="modal-subheader" style="padding: 1em 0 4px 0">
                End Time
            </div>
            <div uib-timepicker ng-model="restriction.endTime" show-spinners="false"></div>
        </div>
    `,
    optionsController: ($scope) => {

    },
    optionsValueDisplay: (restriction) => {
        function formatAMPM(date) {
            date = new Date(date);
            let hours = date.getHours();
            let minutes = date.getMinutes();
            let ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0' + minutes : minutes;
            return hours + ':' + minutes + ' ' + ampm;
        }

        const startTime = formatAMPM(restriction.startTime);
        const endTime = formatAMPM(restriction.endTime);

        return "Between " + startTime + " - " + endTime;
    },
    /*
      function that resolves/rejects a promise based on if the restriction critera is met
    */
    predicate: async (trigger, restrictionData) => {
        return new Promise(async (resolve, reject) => {
            const time = moment(),
                startTime = moment(restrictionData.startTime);

            let endTime = moment(restrictionData.endTime);

            if (endTime.isSameOrBefore(startTime)) {
                endTime = endTime.add(1, 'days');
            }

            if (time.isBetween(startTime, endTime)) {
                resolve();
            } else {
                reject('Time must be between ' + moment(restrictionData.startTime).format('hh:mm A') + ' and ' + moment(restrictionData.endTime).format('hh:mm A') + '.');
            }
        });
    },
    /*
        called after all restrictions in a list are met. Do logic such as deducting currency here.
    */
    onSuccessful: (triggerData, restrictionData) => {

    }

};

module.exports = model;