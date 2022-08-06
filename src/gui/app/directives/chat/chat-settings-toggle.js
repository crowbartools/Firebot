"use strict";
(function() {
    angular
        .module('firebotApp')
        .component("chatSettingsToggle", {
            bindings: {
                setting: "<",
                title: "@",
                inputId: "@",
                externalLink: "@?",
                tooltip: "@?",
                onUpdate: "&"
            },
            template: `
                <div class="flex justify-between items-center">
                    <span class="font-black" id="{{$ctrl.inputId + 'Label'}}">
                        {{$ctrl.title}}
                        <tooltip ng-if="$ctrl.tooltip" text="$ctrl.tooltip"></tooltip>
                        <a ng-if="$ctrl.externalLink" href="{{$ctrl.externalLink}}" target="_blank" class="text-sm"><i class="fas fa-external-link"></i></a>
                    </span>
                    <span>
                        <input class="tgl tgl-light sr-only" id="{{$ctrl.inputId}}" type="checkbox" aria-labelledby="{{$ctrl.inputId + 'Label'}}"
                            ng-checked="$ctrl.setting" ng-click="$ctrl.onUpdate({ setting: !$ctrl.setting });" />
                        <label class="tgl-btn" for="{{$ctrl.inputId}}"></label>
                    </span>
                </div>
            `
        });
}());
