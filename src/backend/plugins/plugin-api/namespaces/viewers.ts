import type { PluginViewersApi } from "../../../../types/plugin-api";

import { definePluginApiNamespace } from "../internal/define-namespace";

import viewerDatabase from "../../../viewers/viewer-database";
import viewerMetadataManager from "../../../viewers/viewer-metadata-manager";

export const createViewersApi = definePluginApiNamespace<PluginViewersApi>(() => {
    return {
        async getViewerByUserId(userId) {
            return await viewerDatabase.getViewerById(userId);
        },

        async getViewerByUsername(username) {
            return await viewerDatabase.getViewerByUsername(username);
        },

        async getViewerMetadataValue(userId, key, propertyPath = undefined) {
            return await viewerMetadataManager.getViewerMetadataByUserId(userId, key, propertyPath);
        },

        async setViewerMetadataValue(userId, key, value, propertyPath = undefined) {
            return await viewerMetadataManager.setViewerMetadataByUserId(userId, key, value, propertyPath);
        },

        async deleteViewerMetadataValue(userId, key) {
            return await viewerMetadataManager.deleteViewerMetadataByUserId(userId, key);
        }
    };
});