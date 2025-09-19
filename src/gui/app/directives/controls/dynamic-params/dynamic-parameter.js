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
            modalId: "@?"
        },
        require: { ngModelCtrl: 'ngModel' },
        template: `

        <div class="form-group" ng-class="{'has-error': $ctrl.hasError}">
            <label
                ng-if="$ctrl.title"
                for="{{$ctrl.name}}"
                class="control-label markdown-container"
                ng-bind-html="$ctrl.title"
            ></label>

            <div
                ng-if="$ctrl.description"
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

            <hr ng-if="$ctrl.schema.showBottomHr" style="margin-top:10px; margin-bottom:15px;" />
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

                console.log(`ngModelCtrl for ${$ctrl.name}`, $ctrl.ngModelCtrl);
            }

            function onTouched() {
                $ctrl.ngModelCtrl.$setTouched();
            }

            function isEmpty(val) {
                return val == null || (typeof val === 'string' && val.trim() === '');
            }

            function renderChild() {
                if (compiledEl) {
                    compiledEl.remove();
                }
                const def = $ctrl.schema && dynamicParameterRegistry.get($ctrl.schema.type);
                const tag = def ? `
                    <${def.tag}
                        schema="$ctrl.schema"
                        value="$ctrl.viewValue"
                        on-input="$ctrl._onInput(value)"
                        on-touched="$ctrl._onTouched()">
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
                $ctrl.hasError = ($ctrl.ngModelCtrl.$$parentForm?.$submitted || $ctrl.ngModelCtrl.$touched)
                        && $ctrl.ngModelCtrl.$invalid;

                if (!$ctrl.hasError) {
                    $ctrl.errorMessages = [];
                    return;
                }

                const errors = $ctrl.ngModelCtrl.$error;
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

            function isModelUnset() {
                const vv = $ctrl.ngModelCtrl.$viewValue;
                const mv = $ctrl.ngModelCtrl.$modelValue;

                // NaN !== NaN: true only when vv is the Angular "uninitialized" sentinel
                const isUninitializedView = vv !== vv;

                // Standard Angular emptiness check
                const isEmptyModel = $ctrl.ngModelCtrl.$isEmpty(mv);
                const isEmptyView = $ctrl.ngModelCtrl.$isEmpty(vv);

                return isUninitializedView || (isEmptyModel && isEmptyView);
            }

            function init() {
                const modelIsUnset = isModelUnset();
                if (modelIsUnset && $ctrl.schema?.default != null) {
                    console.log('Setting default value for param', $ctrl.name, $ctrl.schema.default);
                    $ctrl.ngModelCtrl.$setViewValue(angular.copy($ctrl.schema.default));
                    $ctrl.ngModelCtrl.$render();
                }

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

                $ctrl._unwatchError = $scope.$watchGroup(
                    [
                        () => $ctrl.ngModelCtrl.$invalid,
                        () => $ctrl.ngModelCtrl.$touched,
                        () => $ctrl.ngModelCtrl.$$parentForm?.$submitted
                    ],
                    updateErrorState
                );
            }

            $ctrl.$onInit = $ctrl.$onChanges = function() {
                $ctrl.ngModelCtrl.$render = () => {
                    console.log('Dynamic param render', $ctrl.name, 'viewValue=', $ctrl.ngModelCtrl.$viewValue);
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
