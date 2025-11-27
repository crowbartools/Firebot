"use strict";

(function() {
    angular.module("firebotApp")
        .component("editWebhooksModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title">
                        Webhooks
                    </h4>
                </div>
                <div class="modal-body firebot-list-container">
                    <div class="firebot-list-description">
                        <p class="muted" style="margin: 0 0 20px 0; font-size: 13px;">
                            <i class="fas fa-info-circle" style="margin-right: 6px;"></i>
                            Webhooks allow external services to trigger events in Firebot
                        </p>
                    </div>

                    <div class="firebot-list">
                        <div ng-repeat="webhook in $ctrl.whs.webhookConfigs track by webhook.id" class="firebot-list-item">
                            <div class="firebot-list-item-header">
                                <div class="firebot-list-item-info">
                                    <i class="fas fa-webhook" style="margin-right: 10px; opacity: 0.6;"></i>
                                    <span class="firebot-list-item-name">{{webhook.name}}</span>
                                    <span ng-if="webhook.scriptId != null" class="firebot-list-item-badge" uib-tooltip="This webhook is managed by the {{webhook.scriptId}} script." tooltip-append-to-body="true">
                                        <i class="fas fa-plug" style="margin-right: 4px;"></i>Plugin
                                    </span>
                                </div>
                                <div class="firebot-list-item-actions">
                                    <button class="btn btn-default btn-sm"
                                            ng-click="$ctrl.copyWebhookUrlToClipboard(webhook)"
                                            title="Copy URL to clipboard">
                                        <i class="far fa-copy"></i>
                                        <span>Copy URL</span>
                                    </button>
                                    <button ng-if="webhook.scriptId == null"
                                            class="btn btn-danger btn-sm"
                                            ng-click="$ctrl.whs.deleteWebhookConfig(webhook.id)"
                                            title="Delete webhook">
                                        <i class="far fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button class="btn btn-primary btn-sm" style="width: 100%;" ng-click="$ctrl.createNewWebhook()">
                        <i class="fas fa-plus" style="margin-right: 6px;"></i>
                        Create Webhook
                    </button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(accountAccess, webhooksService, modalFactory, $rootScope, ngToast) {
                const $ctrl = this;

                $ctrl.whs = webhooksService;

                $ctrl.createNewWebhook = () => {
                    modalFactory.openGetInputModal(
                        {
                            model: "",
                            label: "Webhook Name",
                            saveText: "Save",
                            validationFn: (value) => {
                                return new Promise((resolve) => {
                                    if (value == null || value.trim().length < 1) {
                                        resolve(false);
                                    } else {
                                        resolve(true);
                                    }
                                });
                            },
                            validationText: "Webhook name cannot be empty."
                        },
                        (newName) => {
                            webhooksService.saveWebhookConfig({
                                name: newName
                            });
                        });
                };

                $ctrl.copyWebhookUrlToClipboard = (webhook) => {
                    const channelId = accountAccess.accounts.streamer.channelId;
                    const webhookId = webhook.id;

                    const copyText = `https://api.crowbar.tools/v1/webhook/${channelId}/${webhookId}`;

                    $rootScope.copyTextToClipboard(copyText);

                    ngToast.create({
                        className: 'info',
                        content: `Copied webhook URL to clipboard`
                    });
                };
            }
        });
}());