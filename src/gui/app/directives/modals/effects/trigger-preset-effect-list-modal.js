"use strict";

(function() {
    angular.module("firebotApp")
        .component("triggerPresetEffectListModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Run {{$ctrl.presetEffectList.name}}</h4>
                </div>
                <div class="modal-body">
                    <div style="margin-top: 10px;">
                        <div
                            ng-repeat="arg in $ctrl.presetEffectList.args" 
                            style="margin-bottom: 20px;"
                        >
                            <div style="font-size: 15px;font-weight: 600;margin-bottom:5px;">
                                {{arg.name}}
                            </div>
                            <firebot-input 
                                model="$ctrl.arguments[arg.name]" 
                                input-type="string" 
                                disable-variables="true" 
                                placeholder-text="Enter value" 
                            />
                        </div>
                    </div>

                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" ng-click="$ctrl.run()">Run</button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(presetEffectListsService, ngToast) {
                const $ctrl = this;

                $ctrl.presetEffectList = null;

                $ctrl.arguments = {};

                $ctrl.$onInit = () => {
                    $ctrl.presetEffectList = $ctrl.resolve.presetEffectList;
                    $ctrl.arguments = ($ctrl.presetEffectList.args || []).reduce((acc, arg) => {
                        acc[arg.name] = "";
                        return acc;
                    }, {});
                };

                $ctrl.run = () => {
                    presetEffectListsService.manuallyTriggerPresetEffectList(
                        $ctrl.presetEffectList.id,
                        $ctrl.arguments,
                        $ctrl.resolve.isQuickAction === true
                    );
                    ngToast.create({
                        className: 'success',
                        content: `Ran "${$ctrl.presetEffectList.name}"!`
                    });
                    $ctrl.close();
                };
            }
        });
}());
