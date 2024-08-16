"use strict";

(function () {
    const uuid = require("uuid");

    angular.module("firebotApp").component("firebotInput", {
        bindings: {
            inputTitle: "@",
            titleTooltip: "@?",
            placeholderText: "@",
            inputType: "@?",
            dataType: "@?",
            useTextArea: "<",
            disableVariables: "<",
            forceInput: "<?",
            onInputUpdate: "&",
            model: "=",
            style: "@",
            menuPosition: "@?",
            varBtnPosition: "@?",
            class: "@?"
        },
        template: `
                <div style="{{$ctrl.style}}" class="{{$ctrl.class}}">
                    <div ng-if="$ctrl.useInputGroup" class="input-group">
                        <span class="input-group-addon" id="{{$ctrl.inputGroupId}}">{{$ctrl.inputTitle}}<tooltip ng-if="$ctrl.titleTooltip != null" text="$ctrl.titleTooltip"></tooltip></span>
                        <input
                            id="{{$ctrl.inputId}}"
                            ng-if="$ctrl.forceInputInternal"
                            type="{{$ctrl.disableVariables ? $ctrl.inputType || 'text' : 'text'}}"
                            class="form-control"
                            ng-model="$ctrl.model"
                            ng-change="$ctrl.onChange($ctrl.model)"
                            placeholder="{{$ctrl.placeholderText}}"
                            replace-variables="{{$ctrl.dataType}}"
                            disable-variable-menu="$ctrl.disableVariables"
                            menu-position="{{$ctrl.menuPosition}}"
                            button-position="{{$ctrl.varBtnPosition}}"
                        >
                        <textarea
                            id="{{$ctrl.inputId}}"
                            ng-if="!$ctrl.forceInputInternal"
                            ng-model="$ctrl.model"
                            ng-change="$ctrl.onChange($ctrl.model)"
                            class="form-control disable-custom-scroll-styles"
                            ng-class="{ 'single-line-textarea disable-custom-scroll-styles': !$ctrl.allowNewLines }"
                            placeholder="{{$ctrl.placeholderText}}"
                            rows="4"
                            cols="40"
                            replace-variables="{{$ctrl.dataType}}"
                            disable-variable-menu="$ctrl.disableVariables"
                            menu-position="{{$ctrl.menuPosition}}"
                            button-position="{{$ctrl.varBtnPosition}}"
                            ng-attr-wrap="{{$ctrl.wrapMode}}"
                            on-resize="$ctrl.onResize"
                            ng-trim="false"
                        ></textarea>
                    </div>

                    <div ng-if="!$ctrl.useInputGroup">
                        <input
                            id="{{$ctrl.inputId}}"
                            ng-if="$ctrl.forceInputInternal"
                            type="{{$ctrl.disableVariables ? $ctrl.inputType || 'text' : 'text'}}" class="form-control"
                            ng-model="$ctrl.model"
                            ng-change="$ctrl.onChange($ctrl.model)"
                            placeholder="{{$ctrl.placeholderText}}"
                            replace-variables="{{$ctrl.dataType}}"
                            disable-variable-menu="$ctrl.disableVariables"
                            menu-position="{{$ctrl.menuPosition}}"
                            button-position="{{$ctrl.varBtnPosition}}"
                        >
                        <textarea
                            id="{{$ctrl.inputId}}"
                            ng-if="!$ctrl.forceInputInternal"
                            ng-model="$ctrl.model"
                            ng-change="$ctrl.onChange($ctrl.model)"
                            class="form-control disable-custom-scroll-styles"
                            ng-class="{ 'single-line-textarea disable-custom-scroll-styles': !$ctrl.allowNewLines }"
                            placeholder="{{$ctrl.placeholderText}}"
                            rows="4"
                            cols="40"
                            replace-variables="{{$ctrl.dataType}}"
                            disable-variable-menu="$ctrl.disableVariables"
                            menu-position="{{$ctrl.menuPosition}}"
                            button-position="{{$ctrl.varBtnPosition}}"
                            on-resize="$ctrl.onResize"
                            ng-attr-wrap="{{$ctrl.wrapMode}}"
                            ng-trim="false"
                        ></textarea>
                    </div>

                </div>
            `,
        controller: function ($timeout) {
            const $ctrl = this;

            $ctrl.inputGroupId = uuid();
            $ctrl.inputId = uuid();

            $ctrl.allowNewLines = false;

            $ctrl.wrapMode = "soft";

            $ctrl.forceInputInternal = false;

            $ctrl.onChange = (model) => {
                if (!$ctrl.allowNewLines) {
                    model = model.replace(/\n/gm, "");
                }
                $ctrl.model = model;
                $timeout(() => {
                    $ctrl.onInputUpdate();
                }, 25);
            };

            $ctrl.$onInit = () => {
                $ctrl.forceInputInternal = !$ctrl.useTextArea && ($ctrl.forceInput || $ctrl.disableVariables && $ctrl.inputType !== 'text');
                $ctrl.allowNewLines = $ctrl.useTextArea === true;
                $ctrl.wrapMode = $ctrl.useTextArea ? "soft" : "off";
                $ctrl.useInputGroup = $ctrl.inputTitle != null && $ctrl.inputTitle !== "";

                $timeout(() => {
                    $ctrl.onInputUpdate();
                }, 25);
            };

            $ctrl.onResize = () => {
                $ctrl.wrapMode = "soft";
            };

            // This is a hack to make the input field resize properly when it has a scrollbar
            $ctrl.$postLink = () => {
                $timeout(() => {
                    if ($ctrl.useTextArea || $ctrl.forceInputInternal) {
                        return;
                    }

                    const el = document.getElementById($ctrl.inputId);
                    const hasScroll = el?.scrollWidth > el?.clientWidth;
                    if (!hasScroll) {
                        return;
                    }

                    $ctrl.wrapMode = "soft";

                    $timeout(() => {
                        const newEl = document.getElementById($ctrl.inputId);
                        if (newEl) {
                            const newHeight = (newEl.scrollHeight ?? 0) + 9;
                            newEl.style.height = `${newHeight}px`;
                        }
                    }, 25);
                }, 25);
            };
        }
    });
})();
