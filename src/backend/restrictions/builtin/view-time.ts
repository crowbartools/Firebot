import type { RestrictionType } from "../../../types";
import viewerDatabase from '../../viewers/viewer-database';

const model: RestrictionType<{
    time: number;
}> = {
    definition: {
        id: "firebot:viewTime",
        name: "View Time",
        description: "Restricts to users who have been in the stream for X minutes.",
        triggers: []
    },
    optionsTemplate: `
        <div>
            <div id="viewTimeRestriction" class="modal-subheader" style="padding: 0 0 4px 0">
                View Time Minimum
            </div>
            <input type="number" class="form-control" placeholder="Enter minutes" ng-model="restriction.time">
        </div>
    `,
    optionsValueDisplay: (restriction) => {
        const time = restriction.time || 0;

        return `${time}+ min(s)`;
    },
    predicate: async ({ metadata }, { time }) => {
        let passed = false;
        const viewer = await viewerDatabase.getViewerByUsername(metadata.username);
        const viewtime = viewer.minutesInChannel;

        if (viewtime >= time) {
            passed = true;
        }

        return {
            success: passed,
            failureReason: passed !== true
                ? "You have not spent enough time in the channel to use this"
                : undefined
        };
    }
};

export = model;