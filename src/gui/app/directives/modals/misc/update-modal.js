"use strict";

(function() {
    angular.module("firebotApp")
        .component("updateModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Release Notes</h4>
                </div>
                <div class="modal-body">           
                    <div ng-if="$ctrl.getUpdateData() != null">
                        <div ng-if="us.majorUpdate != null">
                            <div class="update-alert alert alert-info" style="display: inline-block;">
                                <p><i class="fas fa-birthday-cake"></i> Great news! A major update ({{$ctrl.updatesService.majorUpdate.gitVersion}}) is available! Check out the update notes to view all the new features and changes. <a class="github-link" href ng-click="$ctrl.openLink(release.gitLink)"><button class="btn btn-primary">View update</button></a></p>
                            </div>
                        </div>

                        <div ng-if="$ctrl.updatesService.majorUpdate == null && !$ctrl.getUpdateData().updateIsAvailable" class="update-alert alert alert-info" style="display: inline-block;">
                            <p><i class="fas fa-check-circle"></i> Firebot is up-to-date.</p>
                        </div>
                    
                        <div class="update-alert alert alert-warning" style="display: inline-block;" ng-if="$ctrl.getUpdateData().updateIsAvailable">
                            <p>Hey! It looks like there was an update released!</p>
                        </div>
                        
                        <div class="latest-update" style="font-size:30px;font-weight:200;">
                            {{$ctrl.getUpdateData().gitName}}
                        </div>
                        <div class="release-date" style="font-weight:600;">
                            {{$ctrl.getUpdateData().gitDate | date: 'medium'}}
                        </div>
                        <div class="update-notes" ng-bind-html="$ctrl.getUpdateData().gitNotes"></div>
                        <div class="modal-footer update-buttons">
                            <a class="github-link" href><button class="btn btn-primary" ng-if="$ctrl.getUpdateData().updateIsAvailable" ng-click="$ctrl.downloadAndInstallUpdate()">Update</button></a>    
                            <a href ng-click="$ctrl.openLink('https://github.com/crowbartools/Firebot/issues/new?assignees=&template=bug_report.yml')"><button class="btn btn-danger">Report Bugs</button></a>
                            <a href ng-click="$ctrl.openLink('https://github.com/crowbartools/Firebot/issues/new?assignees=&template=feature_request.md')"><button class="btn btn-info">Suggest Features</button></a>
                        </div>
                    </div>
                    
                    <div ng-if="$ctrl.getUpdateData() == null">
                        <div class="update-alert alert alert-info" style="display: inline-block;">
                            <p>Release data unavailable.</p>
                        </div>
                    </div>
                </div>
                `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function($rootScope, updatesService) {
                const $ctrl = this;

                $ctrl.updatesService = updatesService;

                $ctrl.openLink = $rootScope.openLinkExternally;

                $ctrl.getUpdateData = () => {
                    return updatesService.updateData;
                };

                // Get update information if we havent already
                if (!updatesService.hasCheckedForUpdates) {
                    updatesService.checkForUpdate();
                }

                $ctrl.downloadAndInstallUpdate = () => {
                    if (process.platform === 'win32') {
                        updatesService.downloadAndInstallUpdate();
                    } else {
                        $rootScope.openLinkExternally(updatesService.updateData.gitLink);
                    }
                };

                $ctrl.canUpdateAutomatically = () => {
                    return process.platform === 'win32';
                };
            }
        });
}());
