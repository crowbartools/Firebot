"use strict";

(function() {
    /** @typedef {import("../../../types/webhooks").WebhookConfig} WebhookConfig */

    angular
        .module("firebotApp")
        .factory("webhooksService", function(backendCommunicator) {
            const service = {};

            /** @type {WebhookConfig[]} */
            service.webhookConfigs = [];

            /**
             * @param {WebhookConfig} webhook
             * @returns {void}
             */
            const updateWebhook = (webhook) => {
                const index = service.webhookConfigs.findIndex(m => m.id === webhook.id);
                if (index > -1) {
                    service.webhookConfigs[index] = webhook;
                } else {
                    service.webhookConfigs.push(webhook);
                }
            };

            service.loadWebhookConfigs = async () => {
                const webhookConfigs = await backendCommunicator.fireEventAsync("webhooks:get-all");

                if (webhookConfigs) {
                    service.webhookConfigs = webhookConfigs;
                }
            };

            /**
             * @param {string} webhookId
             * @returns {WebhookConfig}
             */
            service.getWebhookConfig = (webhookId) => {
                return service.webhookConfigs.find(l => l.id === webhookId);
            };

            /**
             * @param {WebhookConfig} webhook
             * @returns {Promise.<void>}
             */
            service.saveWebhookConfig = async (webhook) => {
                const savedWebhook = await backendCommunicator.fireEventAsync("webhooks:save", JSON.parse(angular.toJson(webhook)));

                if (savedWebhook) {
                    updateWebhook(savedWebhook);
                    return true;
                }

                return false;
            };

            service.deleteWebhookConfig = function(webhookId) {
                service.webhookConfigs = service.webhookConfigs.filter(t => t.id !== webhookId);
                backendCommunicator.fireEvent("webhooks:delete", webhookId);
            };

            backendCommunicator.on("webhooks:updated", (webhookConfigs) => {
                service.webhookConfigs = webhookConfigs;
            });

            return service;
        });
}());