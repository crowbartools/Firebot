import type { SortTag } from "../../types/sort-tags";

import { SettingsManager } from "../common/settings-manager";
import { ProfileManager } from "../common/profile-manager";
import frontendCommunicator from "../common/frontend-communicator";
import logger from "../logwrapper";

interface SortTagCache {
    [context: string]: SortTag[];
}

class SortTagManager {
    sortTags: SortTagCache = { };

    constructor() {
        frontendCommunicator.on("sort-tags:get-sort-tags", () => {
            return this.sortTags ?? { };
        });

        frontendCommunicator.on("sort-tags:save-sort-tags", (request: { context: string, sortTags: SortTag[] }) => {
            this.saveSortTagsForContext(request.context, request.sortTags);
        });
    }

    getSortTagsDb() {
        return ProfileManager.getJsonDbInProfile("sort-tags");
    }

    loadSortTags() {
        logger.debug("Attempting to load tags");

        try {
            const sortTagsData = this.getSortTagsDb().getData("/") as SortTagCache;

            if (sortTagsData) {
                this.sortTags = sortTagsData;
            }

            logger.debug(`Loaded tags.`);
        } catch (err) {
            logger.warn(`There was an error reading tags file.`, err);
        }

        this.getLegacyEventAndCommandTags();
    }

    private getLegacyEventAndCommandTags() {
        if (!SettingsManager.getSetting("LegacySortTagsImported")) {
            SettingsManager.saveSetting("LegacySortTagsImported", true);

            const legacySortTags: SortTagCache = {
                commands: [],
                events: []
            };

            try {
                const commandsDb = ProfileManager.getJsonDbInProfile("/chat/commands");

                legacySortTags.commands = commandsDb.getData("/sortTags") as SortTag[];

                commandsDb.delete("/sortTags");
            } catch { }

            try {
                const eventsDb = ProfileManager.getJsonDbInProfile("/events/events");

                legacySortTags.events = eventsDb.getData("/sortTags") as SortTag[];

                eventsDb.delete("/sortTags");
            } catch { }

            Object.keys(legacySortTags).forEach((context) => {
                if (this.sortTags[context] == null) {
                    this.sortTags[context] = [];
                }

                const tags = legacySortTags[context]
                    .filter(t => this.sortTags[context].every(st => st.id !== t.id));

                if (tags.length > 0) {
                    this.sortTags[context] = [
                        ...this.sortTags[context],
                        ...tags
                    ];
                }
            });

            this.saveAllSortTags();
        }
    }

    saveSortTagsForContext(context: string, sortTags: SortTag[]) {
        this.sortTags[context] = sortTags;
        this.saveAllSortTags();
    }

    getSortTagsForContext(context: string) {
        return this.sortTags[context] ?? [];
    }

    private saveAllSortTags() {
        try {
            this.getSortTagsDb().push("/", this.sortTags);

            frontendCommunicator.send("sort-tags:updated-sort-tags", this.sortTags);
            logger.debug("Saved tags");
        } catch (error) {
            logger.warn("There was an error saving tags", error);
        }
    }
}

const sortTagManager = new SortTagManager();

export { sortTagManager as SortTagManager };