import { EffectType } from "../../../../types/effects";
import { runEffects } from "../../../common/effect-runner";

interface SwitchCase {
    label?: string;
    type?: "compare" | "range";
    value?: string;
    min?: string; // These are strings because of HTML inputs.
    max?: string;
    effectList?: unknown;
    fallthrough?: boolean;
}

interface EffectModel {
    value: string;
    cases: SwitchCase[];
    defaultCase: SwitchCase;
    bubbleOutputs: boolean;
}

type Scope = ng.IScope & {
    effect: EffectModel;
    openFirst: boolean;
    sortableOptions: unknown;
    addCase(): void;
    duplicateCase(index: number): void;
    deleteCase(index: number): void;
    effectListUpdated(effects: unknown, index: number | "default"): void;
    getAutomaticLabel(switchCase: SwitchCase): string;
};

const model: EffectType<EffectModel> = {
    definition: {
        id: "firebot:switch-statement",
        name: "Switch Statement",
        description: "Simplified conditional effect for use with a single input",
        icon: "far fa-code-branch",
        categories: ["advanced", "scripting"]
    },
    optionsTemplate: `
        <setting-container header="Switch Value">
            <firebot-input model="effect.value" placeholder-text="Enter Value" use-text-area="true" rows="4" cols="40"
                menu-position="under" />
        </setting-container>

        <setting-container header="Cases" pad-top="true">
            <div ui-sortable="sortableOptions" class="eos-container" ng-model="effect.cases">
                <div ng-repeat="switchCase in effect.cases" style="margin-bottom: 15px;">
                    <switch-section label="switchCase.label" header="{{switchCase.fallthrough ? 'Fallthrough' : 'Case'}}"
                        auto-label="getAutomaticLabel(switchCase)" initially-open="$index === 0 && openFirst">
                        <div style="margin-bottom: 15px;">
                            <firebot-select options="{ compare: 'Compare number or text', range: 'Number Range' }"
                                selected="switchCase.type"></firebot-select>
                        </div>

                        <firebot-input input-title="Value" disable-variables="true" model="switchCase.value"
                            placeholder-text="Enter expected value"
                            ng-show="switchCase.type !== 'range'" style="margin-bottom: 15px;"></firebot-input>
                        <div ng-show="switchCase.type === 'range'" class="input-group" style="margin-bottom: 15px;">
                            <span class="input-group-addon">Minimum</span>
                            <input type="text" class="form-control" type="number" ng-model="switchCase.min">
                            <span class="input-group-addon">Maximum</span>
                            <input type="text" class="form-control" type="number" ng-model="switchCase.max">
                        </div>

                        <div ng-style="{'margin-bottom': switchCase.fallthrough ? '0' : '15px'}">
                            <firebot-checkbox model="switchCase.fallthrough" label="Fallthrough"
                                tooltip="Whether or not you want to run the next case if this one matches." />
                        </div>

                        <effect-list effects="switchCase.effectList" trigger="{{trigger}}" trigger-meta="triggerMeta"
                            update="effectListUpdated(effects, $index)" modalId="{{modalId}}" ng-hide="switchCase.fallthrough"></effect-list>

                        <div style="margin-top: 10px">
                            <button class="btn btn-default" ng-click="duplicateCase($index)" title="Duplicate Case">
                                <i class="far fa-clone"></i>
                            </button>
                            <button class="btn btn-danger" ng-click="deleteCase($index)" title="Delete Case">
                                <i class="far fa-trash"></i>
                            </button>
                        </div>
                    </switch-section>
                </div>
            </div>

            <button class="btn btn-link" ng-click="addCase()"><i class="fal fa-plus"></i> Add Case</button>

            <div style="margin-top: 15px;">
                <switch-section label="effect.defaultCase.label" header="Default" draggable="false">
                    <effect-list effects="effect.defaultCase.effectList" trigger="{{trigger}}" trigger-meta="triggerMeta"
                        update="effectListUpdated(effects, 'default')" modalId="{{modalId}}"></effect-list>
                </switch-section>
            </div>
        </setting-container>

        <setting-container header="Options" pad-top="true">
            <firebot-checkbox model="effect.bubbleOutputs" label="Apply effect outputs to parent list"
                tooltip="Whether or not you want any effect outputs to be made available to the parent effect list." />
        </setting-container>
    `,
    optionsController: ($scope: Scope, utilityService, objectCopyHelper) => {
        $scope.sortableOptions = {
            handle: ".dragHandle",
            stop: () => { }
        };

        $scope.addCase = () => {
            $scope.effect.cases.push({
                type: "compare"
            });
        };

        $scope.getAutomaticLabel = (switchCase: SwitchCase) => {
            if (!switchCase || !switchCase.type) {
                return "No condition";
            }

            if (switchCase.type === "compare") {
                return switchCase.value || "No value";
            }

            if (switchCase.type === "range" && (switchCase.min == null || switchCase.max == null || isNaN(Number(switchCase.min)) || isNaN(Number(switchCase.max)) || Number(switchCase.min) >= Number(switchCase.max))) {
                return "Invalid Number Range";
            }

            return `${switchCase.min}-${switchCase.max}`;
        };

        $scope.duplicateCase = (index: number) => {
            const newCase = objectCopyHelper.copyAndReplaceIds($scope.effect.cases[index]) as SwitchCase;
            const currentLabel = newCase.label?.length
                ? newCase.label
                : $scope.getAutomaticLabel(newCase);
            newCase.label = currentLabel?.length
                ? `${currentLabel} Copy`
                : "Copy";

            $scope.effect.cases.splice(index + 1, 0, newCase);
        };

        $scope.deleteCase = (index: number) => {
            utilityService.showConfirmationModal({
                title: "Remove Case",
                question: `Are you sure you want to remove this switch case?`,
                confirmLabel: "Remove",
                confirmBtnType: "btn-danger"
            }).then((confirmed: boolean) => {
                if (confirmed) {
                    $scope.effect.cases.splice(index, 1);
                }
            });
        };

        $scope.effectListUpdated = (effects: unknown, index: number | "default") => {
            if (index === "default") {
                $scope.effect.defaultCase.effectList = effects;
            } else {
                $scope.effect.cases[index].effectList = effects;
            }
        };

        if ($scope.effect.cases == null) {
            $scope.openFirst = true;
            $scope.effect.cases = [{
                type: "compare"
            }];
        }

        if ($scope.effect.defaultCase == null) {
            $scope.effect.defaultCase = {};
        }
    },
    optionsValidator: (effect) => {
        if (!effect.value || effect.value.toString().trim() === "") {
            return ["Value is required."];
        }

        if (effect.cases.some((switchCase) => {
            return switchCase.type === "range" &&
                    (switchCase.min == null || switchCase.max == null ||
                        Number.isNaN(Number(switchCase.min)) || Number.isNaN(Number(switchCase.max)) ||
                        Number(switchCase.min) >= Number(switchCase.max));
        })) {
            return ["Invalid number range in one or more cases. Make sure Minimum and Maximum are set correctly."];
        }
    },
    onTriggerEvent: async (event) => {
        const { effect, trigger, outputs, abortSignal } = event;
        const value = effect.value;
        const stringValue = typeof value === "string" ? value : String(value);
        const numberValue = typeof value === "number" ? value : Number(value);

        let fallthrough = false;

        let effectList: unknown;

        for (const switchCase of effect.cases) {
            if (fallthrough && !switchCase.fallthrough) {
                effectList = switchCase.effectList;
                break;
            } else if (fallthrough && switchCase.fallthrough) {
                continue;
            }

            if (switchCase.type === "compare") {
                if ((switchCase.value === "" || switchCase.value == null) && (stringValue === "" || stringValue == null) || stringValue === switchCase.value) {
                    if (switchCase.fallthrough) {
                        fallthrough = true;
                    } else {
                        effectList = switchCase.effectList;
                        break;
                    }
                }
            } else {
                if (switchCase.min != null && switchCase.max != null &&
                        numberValue >= Number(switchCase.min) &&
                        numberValue <= Number(switchCase.max)) {
                    if (switchCase.fallthrough) {
                        fallthrough = true;
                    } else {
                        effectList = switchCase.effectList;
                        break;
                    }
                }
            }
        }

        if (!effectList) {
            effectList = effect.defaultCase.effectList;
        }

        if (!effectList || abortSignal?.aborted) {
            return;
        }

        const result = await runEffects({
            trigger: trigger,
            outputs,
            effects: effectList
        });

        if (result?.success && result?.stopEffectExecution) {
            return {
                success: true,
                outputs: effect.bubbleOutputs ? result?.outputs : undefined,
                execution: {
                    stop: true,
                    bubbleStop: true
                }
            };
        }

        return {
            success: true,
            outputs: effect.bubbleOutputs ? result?.outputs : undefined
        };
    }
};

export = model;