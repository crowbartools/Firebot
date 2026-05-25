"use strict";
(function() {
    const { marked } = require("marked");
    const { sanitize } = require("dompurify");

    angular.module("firebotApp").component("dynamicParameter", {
        bindings: {
            name: '@?',
            schema: "<",
            trigger: "@?",
            triggerMeta: "<?",
            modalId: "@?",
            hideTitleAndDescription: "<?",
            enableReplaceVariables: "<?"
        },
        require: { ngModelCtrl: 'ngModel' },
        template: `

        <div class="form-group" ng-class="{'has-error': $ctrl.hasError}">
            <label
                ng-if="$ctrl.title && !$ctrl.hideTitle"
                for="{{$ctrl.name}}"
                class="control-label markdown-container"
                ng-bind-html="$ctrl.title"
            ></label>

            <div
                ng-if="$ctrl.description && !$ctrl.hideDescription"
                style="padding-bottom: 5px;font-size: 13px;font-weight: 100;opacity:0.8;"
                class="markdown-container"
                ng-bind-html="$ctrl.description"
            ></div>

            <div id="dynamic-parameter-container"></div>

            <div
                ng-if="$ctrl.tip != null && $ctrl.tip !== ''"
                class="muted markdown-container"
                style="font-size:12px; padding-top: 3px;"
                ng-bind-html="$ctrl.tip"
            ></div>

            <div ng-if="$ctrl.hasError">
                <span ng-repeat="error in $ctrl.errorMessages" class="help-block">{{ error }}</span>
            </div>

            <hr ng-if="$ctrl.schema.showBottomHr" style="margin-top: 30px;" />
        </div>

       `,
        controller: function($element, $compile, $scope, $sce, dynamicParameterRegistry) {
            const $ctrl = this;
            let compiledEl;

            $ctrl.viewValue = undefined;

            $ctrl.hasError = false;
            $ctrl.errorMessages = [];

            function onInput(val) {
                $ctrl.viewValue = val;
                $ctrl.ngModelCtrl.$setViewValue(val);
            }

            function onTouched() {
                $ctrl.ngModelCtrl.$setTouched();
            }

            function isEmpty(val) {
                return val == null || (typeof val === 'string' && val.trim() === '');
            }

            $ctrl.hideTitle = false;
            $ctrl.hideDescription = false;

            function renderChild() {
                if (compiledEl) {
                    compiledEl.remove();
                }
                const def = $ctrl.schema && dynamicParameterRegistry.get($ctrl.schema.type);

                $ctrl.hideTitle = def?.hideTitle ?? $ctrl.hideTitleAndDescription ?? false;
                $ctrl.hideDescription = def?.hideDescription ?? $ctrl.hideTitleAndDescription ?? false;

                const tag = def ? `
                    <${def.tag}
                        ng-if="$ctrl.defaultHandled"
                        schema="$ctrl.schema"
                        value="$ctrl.viewValue"
                        on-input="$ctrl._onInput(value)"
                        on-touched="$ctrl._onTouched()"
                        context="$ctrl.context"
                        name="{{$ctrl.name}}"
                        enable-replace-variables="$ctrl.enableReplaceVariables"
                    >
                    </${def.tag}>`
                    : `<div class="fb-param-unsupported">Unsupported type: ${$ctrl.schema && $ctrl.schema.type}</div>`;

                // expose handlers on $ctrl for template
                $ctrl._onInput = onInput;
                $ctrl._onTouched = onTouched;

                compiledEl = $compile(tag)($scope);


                let container = $element.find('#dynamic-parameter-container')[0];

                if (!container) {
                    return;
                }

                // Wrap in jQuery lite
                container = angular.element(container);
                container.empty();
                container.append(compiledEl);
            }

            function buildValidatorsFromSchema() {
                const schema = $ctrl.schema || {};
                const validation = schema.validation || {};
                const paramDef = dynamicParameterRegistry.get(schema.type);

                const N = $ctrl.ngModelCtrl;

                N.$validators = Object.assign({}, N.$validators);
                N.$asyncValidators = Object.assign({}, N.$asyncValidators);

                // built-in validators
                if (validation.required != null) {
                    N.$validators.required = (_, view) => (validation.required ? !isEmpty(view) : true);
                }
                if (validation.minLength != null) {
                    N.$validators.minLength = (_, view) => (view == null ? true : String(view).length >= validation.minLength);
                }
                if (validation.maxLength != null) {
                    N.$validators.maxLength = (_, view) => (view == null ? true : String(view).length <= validation.maxLength);
                }
                if (validation.min != null) {
                    N.$validators.min = (_, view) => (view == null ? true : view >= validation.min);
                }
                if (validation.max != null) {
                    N.$validators.max = (_, view) => (view == null ? true : view <= validation.max);
                }
                if (validation.pattern != null) {
                    const re = validation.pattern instanceof RegExp ? validation.pattern : new RegExp(validation.pattern);
                    N.$validators.pattern = (_, view) => (view == null || view === '' ? true : re.test(String(view)));
                }

                if (paramDef && paramDef.validators) {
                    for (const [name, { fn, async }] of Object.entries(paramDef.validators)) {
                        if (validation[name] == null) {
                            continue;
                        }
                        if (async) {
                            N.$asyncValidators[name] = (_, view) => {
                                try {
                                    const p = fn(view, validation[name]);
                                    if (!p || !p.then) {
                                        return Promise.resolve();
                                    }
                                    return p.then(ok => (ok ? true : Promise.reject()));
                                } catch {
                                    return Promise.reject();
                                }
                            };
                        } else {
                            N.$validators[name] = (_, view) => {
                                try {
                                    return !!fn(view, validation[name]);
                                } catch {
                                    return false;
                                }
                            };
                        }
                    }
                }
            }

            function updateErrorState() {
                const modelCtrl = $ctrl.ngModelCtrl.$$parentForm?.[$ctrl.ngModelCtrl.$name] ?? $ctrl.ngModelCtrl;

                $ctrl.hasError = ($ctrl.ngModelCtrl.$$parentForm?.$submitted || modelCtrl.$touched)
                        && modelCtrl.$invalid;

                if (!$ctrl.hasError) {
                    $ctrl.errorMessages = [];
                    return;
                }

                const errors = modelCtrl.$error;
                const schema = $ctrl.schema || {};
                const paramDef = dynamicParameterRegistry.get(schema.type);
                const messages = [];

                if (errors.required) {
                    messages.push('Required.');
                }
                if (errors.minLength) {
                    messages.push(`Must be at least ${schema.validation.minLength} characters.`);
                }
                if (errors.maxLength) {
                    messages.push(`Must be at most ${schema.validation.maxLength} characters.`);
                }
                if (errors.min) {
                    messages.push(`Must be at least ${schema.validation.min}.`);
                }
                if (errors.max) {
                    messages.push(`Must be at most ${schema.validation.max}.`);
                }
                if (errors.pattern) {
                    messages.push(`Invalid format.`);
                }
                if (paramDef && paramDef.validators) {
                    for (const [name, { message }] of Object.entries(paramDef.validators)) {
                        if (errors[name]) {
                            if (typeof message === 'function') {
                                messages.push(message(schema.validation[name], schema));
                            } else if (typeof message === 'string') {
                                messages.push(message);
                            } else {
                                messages.push(`Invalid (${name}).`);
                            }
                        }
                    }
                }

                const title = schema.title ? schema.title.replace(/[*_`]/g, '') : 'This field';
                $ctrl.errorMessages = messages.map(m => m.replace(/%title%/g, title));
            }

            function parseMarkdown(text) {
                if (!text) {
                    return text;
                }
                return $sce.trustAsHtml(
                    sanitize(marked(text))
                );
            }

            function init() {
                $ctrl.context = {
                    trigger: $ctrl.trigger,
                    triggerMeta: $ctrl.triggerMeta,
                    modalId: $ctrl.modalId
                };

                if ($ctrl.schema.title) {
                    $ctrl.title = parseMarkdown($ctrl.schema.title);
                }

                if ($ctrl.schema.description) {
                    $ctrl.description = parseMarkdown($ctrl.schema.description);
                }

                if ($ctrl.schema.tip) {
                    $ctrl.tip = parseMarkdown($ctrl.schema.tip);
                }

                buildValidatorsFromSchema();
                renderChild();

                if ($ctrl._unwatchError) {
                    $ctrl._unwatchError();
                }
                $ctrl._unwatchError = $scope.$watchGroup(
                    [
                        () => $ctrl.ngModelCtrl.$invalid,
                        () => $ctrl.ngModelCtrl.$$parentForm?.[$ctrl.ngModelCtrl.$name]?.$invalid,
                        () => $ctrl.ngModelCtrl.$touched,
                        () => $ctrl.ngModelCtrl.$$parentForm?.$submitted
                    ],
                    updateErrorState
                );
            }

            $ctrl.defaultHandled = false;
            $scope.$watch(() => $ctrl.ngModelCtrl.$modelValue, (newVal) => {
                if ($ctrl.defaultHandled) {
                    return;
                }
                if (newVal === undefined && $ctrl.schema?.default != null) {
                    $ctrl.ngModelCtrl.$setViewValue(angular.copy($ctrl.schema.default));
                    $ctrl.ngModelCtrl.$render();
                }
                $ctrl.defaultHandled = true;
            });

            $ctrl.$onInit = $ctrl.$onChanges = function() {
                $ctrl.ngModelCtrl.$render = () => {
                    $ctrl.viewValue = $ctrl.ngModelCtrl.$viewValue;
                };
                init();
            };

            $ctrl.$onDestroy = function () {
                if ($ctrl._unwatchError) {
                    $ctrl._unwatchError();
                }
            };
        }
    });
}());
