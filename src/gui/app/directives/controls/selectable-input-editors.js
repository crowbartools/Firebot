"use strict";

(function () {
    angular.module("firebotApp").component("selectableInputEditors", {
        bindings: {
            editors: "<",
            initialEditorLabel: "<?",
            model: "="
        },
        template: `
        <div ng-class="{ 'input-editor-selector-container': $ctrl.editors.length > 1 }">
            <div ng-if="$ctrl.editors.length > 1" class="flex items-center">
                <div class="text-dropdown input-editor-dropdown" uib-dropdown uib-dropdown-toggle>
                    <a href role="button" class="ddtext" style="font-size: 12px;">{{$ctrl.selectedEditor ? $ctrl.selectedEditor.label : ''}}<span class="fb-arrow down ddtext"></span></a>
                    <ul class="dropdown-menu" uib-dropdown-menu role="menu">
                        <li class="dropdown-header">Editor Types</li>
                        <li ng-repeat="option in $ctrl.editors track by option.label" role="none">
                            <a href class="pl-4" ng-click="$ctrl.selectedEditor = option" role="menuitem" aria-label="{{option.label}}">
                                <span>{{option.label}}</span>
                                <span
                                    ng-show="$ctrl.selectedEditor && $ctrl.selectedEditor.label === option.label"
                                    style="color:green;display: inline-block;"
                                >
                                    <i class="fas fa-check"></i>
                                </span>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
            <div ng-if="$ctrl.selectedEditor != null">
                <firebot-input
                    input-title="{{$ctrl.selectedEditor.inputTitle || ''}}"
                    input-type="{{$ctrl.selectedEditor.inputType || ''}}"
                    title-tooltip="{{$ctrl.selectedEditor.titleTooltip || ''}}"
                    placeholder-text="{{$ctrl.selectedEditor.placeholderText || ''}}"
                    data-type="{{$ctrl.selectedEditor.dataType || ''}}"
                    use-text-area="$ctrl.selectedEditor.useTextArea"
                    disable-variables="$ctrl.selectedEditor.disableVariables"
                    force-input="$ctrl.selectedEditor.forceInput"
                    on-input-update="$ctrl.selectedEditor.onInputUpdate"
                    code-mirror-options="$ctrl.selectedEditor.codeMirrorOptions"
                    model="$ctrl.model"
                    style="{{$ctrl.selectedEditor.style || ''}}"
                    menu-position="{{$ctrl.selectedEditor.menuPosition || ''}}"
                    var-btn-position="{{$ctrl.selectedEditor.varBtnPosition || ''}}"
                    class="{{$ctrl.selectedEditor.class || ''}}"
                ></firebot-input>
            </div>
        </div>`,
        controller: function () {
            const $ctrl = this;

            $ctrl.selectedEditor = null;

            $ctrl.$onInit = () => {
                $ctrl.selectedEditor = $ctrl.initialEditorLabel
                    ? $ctrl.editors.find(o => o.label === $ctrl.initialEditorLabel) ?? $ctrl.editors[0]
                    : $ctrl.editors[0];
            };
        }
    });
})();