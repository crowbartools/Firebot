"use strict";

(function() {
    angular.module("firebotApp")
        .component("editWebhooksModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title">Edit Webhooks</h4>
                </div>
                <div class="modal-body">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>URL</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr ng-repeat="webhook in $ctrl.whs.webhookConfigs track by webhook.id">
                                <td>{{webhook.name}}</td>
                                <td><a href ng-click="$ctrl.copyWebhookUrlToClipboard(webhook)">Copy URL</a></td>
                                <td>
                                    <span ng-if="webhook.scriptId == null" class="effect-delete-btn clickable pull-right" ng-click="$ctrl.whs.deleteWebhookConfig(webhook.id)"><i class="far fa-trash-alt"></i></span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <button class="btn btn-default btn-sm" ng-click="$ctrl.createNewWebhook()">+ Create Webhook</button>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" ng-click="$ctrl.dismiss()">Done</button>
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
                        content: `Copied '${copyText}' to clipboard`
                    });
                };
            }
        });
}());