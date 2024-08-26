import { FirebotViewer } from "../../types/viewers";

import logger from "../logwrapper";
import viewerDatabase from "./viewer-database";
import jsonDataHelpers from "../common/json-data-helpers";
import frontendCommunicator from "../common/frontend-communicator";
import eventManager from "../events/EventManager";

interface ViewerMetadataUpdateRequest {
    username: string;
    key: string;
    value: string;
}

interface ViewerMetadataDeleteRequest {
    username: string;
    key: string;
}

class ViewerMetadataManager {
    constructor() {
        frontendCommunicator.onAsync("update-viewer-metadata",
            async (updateRequest: ViewerMetadataUpdateRequest) => {
                this.updateViewerMetadata(updateRequest.username, updateRequest.key, updateRequest.value);
            });

        frontendCommunicator.onAsync("delete-viewer-metadata",
            async (deleteRequest: ViewerMetadataDeleteRequest) => {
                this.removeViewerMetadata(deleteRequest.username, deleteRequest.key);
            });
    }

    async getViewerMetadata(username: string, key: string, propertyPath: string): Promise<unknown> {
        if (!username.length || !key.length) {
            return;
        }

        const viewer = await viewerDatabase.getViewerByUsername(username);

        if (viewer == null) {
            return;
        }

        const metadata = viewer.metadata || {};

        return jsonDataHelpers.readData(metadata[key], propertyPath);
    }

    async getTopMetadataPosition(metadataKey: string, position = 1): Promise<FirebotViewer> {
        if (viewerDatabase.isViewerDBOn() !== true) {
            return;
        }

        const sortObj = {};
        sortObj[`metadata.${metadataKey}`] = -1;

        const projectionObj = { username: 1, displayName: 1, metadata: 1};

        try {
            const metadata = await viewerDatabase.getViewerDb()
                .findAsync({ twitch: true })
                .sort(sortObj)
                .skip(position - 1)
                .limit(1)
                .projection(projectionObj);

            return metadata[0];
        } catch (error) {
            logger.error("Error getting top metadata request: ", error);
            return;
        }
    }

    async getTopMetadata(metadataKey: string, count: number): Promise<FirebotViewer[]> {
        if (viewerDatabase.isViewerDBOn() !== true) {
            return [];
        }

        const sortObj = {};
        sortObj[`metadata.${metadataKey}`] = -1;

        const projectionObj = { username: 1, displayName: 1, metadata: 1};

        try {
            const metadata = await viewerDatabase.getViewerDb()
                .findAsync({ twitch: true })
                .sort(sortObj)
                .limit(count)
                .projection(projectionObj);

            return metadata || [];
        } catch (error) {
            logger.error("Error getting top metadata list: ", error);
            return [];
        }
    }

    async updateViewerMetadata(username: string, key: string, value: string, propertyPath: string = null): Promise<void> {
        if (!username.length || !key.length) {
            return;
        }

        const viewer = await viewerDatabase.getViewerByUsername(username);
        if (viewer == null) {
            return;
        }

        const metadata = viewer.metadata || {};

        try {
            const dataToSet = jsonDataHelpers.parseData(value, metadata[key], propertyPath);
            metadata[key] = dataToSet;

            viewer.metadata = metadata;

            await viewerDatabase.updateViewer(viewer);

            await viewerDatabase.calculateAutoRanks(viewer._id, "metadata");

            eventManager.triggerEvent("firebot", "viewer-metadata-updated", {
                username,
                metadataKey: key,
                metadataValue: dataToSet
            });

        } catch (error) {
            logger.error("Unable to set metadata for viewer");
        }
    }

    async removeViewerMetadata(username: string, key: string): Promise<void> {
        if (!username.length || !key.length) {
            return;
        }

        const viewer = await viewerDatabase.getViewerByUsername(username);
        if (viewer == null) {
            return;
        }

        const metadata = viewer.metadata || {};

        delete metadata[key];

        viewer.metadata = metadata;

        await viewerDatabase.updateViewer(viewer);

        await viewerDatabase.calculateAutoRanks(viewer._id, "metadata");

        eventManager.triggerEvent("firebot", "viewer-metadata-updated", {
            username,
            metadataKey: key,
            metadataValue: null
        });
    }
}

const viewerMetadataManager = new ViewerMetadataManager();

export = viewerMetadataManager;