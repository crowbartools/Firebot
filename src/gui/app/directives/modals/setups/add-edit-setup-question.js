"use strict";

(function() {
    const { v4: uuid } = require("uuid");
    angular.module("firebotApp")
        .component("addOrEditSetupQuestion", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">{{$ctrl.isNewQuestion ? 'Add' : 'Edit'}} Setup Import Question</h4>
                </div>
                <div class="modal-body">
                    <h3>Question <tooltip text="'This is the question that will be asked when a user imports. Ie, What should be the default bet amount?'"/></h3>
                    <textarea type="text" class="form-control" rows="3" ng-model="$ctrl.question.question" placeholder="Enter question"></textarea>

                    <h3>Replace Token <tooltip text="'Firebot will replace any instances of this token with the users answer to this question. A token can be anything but you might want to use uncommon characters. Ie %WagerAmount%'"/></h3>
                    <input type="text" class="form-control" ng-model="$ctrl.question.replaceToken" placeholder="Enter text" />

                    <h3>Tooltip Text <tooltip text="'This is extra text that will showup in a tooltip (Just like this!) Optional.'"/></h3>
                    <textarea type="text" class="form-control" rows="3" ng-model="$ctrl.question.helpText" placeholder="Optional"></textarea>

                    <h3>Answer Type</h3>
                    <select
                        class="fb-select"
                        ng-model="$ctrl.question.answerType"
                        ng-change="$ctrl.question.defaultAnswer = undefined";
                        ng-options="answerType.id as answerType.name for answerType in $ctrl.answerTypes">
                        <option value="" disabled selected>Select answer type...</option>
                    </select>

                    <h3>Default Answer <tooltip text="'This is a default answer that will be initially set in the answer text field. Optional.'"/></h3>
                    <input type="{{$ctrl.question.answerType}}" class="form-control" ng-model="$ctrl.question.defaultAnswer" placeholder="Optional" />
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                    <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function(ngToast) {
                const $ctrl = this;

                $ctrl.isNewQuestion = true;

                $ctrl.answerTypes = [
                    {
                        id: "text",
                        name: "Text"
                    }, {
                        id: "number",
                        name: "Number"
                    }
                ];

                $ctrl.question = {
                    id: uuid(),
                    question: undefined,
                    helpText: undefined,
                    defaultAnswer: undefined,
                    answerType: "text",
                    replaceToken: undefined
                };

                $ctrl.$onInit = () => {
                    if ($ctrl.resolve.question) {
                        $ctrl.question = JSON.parse(angular.toJson($ctrl.resolve.question));
                        if ($ctrl.question.answerType == null) {
                            $ctrl.question.answerType = "text";
                        }
                        $ctrl.isNewQuestion = false;
                    }
                };

                $ctrl.save = () => {
                    if ($ctrl.question.question == null || $ctrl.question.question === "") {
                        ngToast.create("Please include a question!");
                        return;
                    }

                    if ($ctrl.question.replaceToken == null || $ctrl.question.replaceToken === "") {
                        ngToast.create("Please include a replace token!");
                        return;
                    }

                    $ctrl.close({
                        $value: $ctrl.question
                    });
                };
            }
        });
}());
