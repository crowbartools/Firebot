"use strict";

(function() {
    angular.module("firebotApp")
        .component("sortTagList", {
            bindings: {
                allTags: "<",
                currentTagIds: "="
            },
            template: `
                <div>
                    <div class="role-bar" ng-repeat="tagId in $ctrl.currentTagIds track by $index">
                        <span>{{$ctrl.getTagName(tagId)}}</span>
                        <span class="clickable" style="padding-left: 10px;" ng-click="$ctrl.removeTag(tagId)" uib-tooltip="Remove sort tag" tooltip-append-to-body="true">
                            <i class="far fa-times"></i>
                        </span>
                    </div>
                    <div class="role-bar clickable" ng-if="$ctrl.hasTagsAvailable" ng-click="$ctrl.addTag()" uib-tooltip="Add sort tag" tooltip-append-to-body="true">
                        <i class="far fa-plus"></i>
                    </div>
                </div>
            `,
            controller: function(utilityService) {
                let $ctrl = this;

                $ctrl.getTagName = id => {
                    const tag = $ctrl.allTags.find(t => t.id === id);
                    return tag ? tag.name : "";
                };

                $ctrl.hasTagsAvailable = false;
                function updateTagsAvailable() {
                    $ctrl.hasTagsAvailable = $ctrl.allTags.filter(t => !$ctrl.currentTagIds.some(id => id === t.id)).length > 0;
                }

                $ctrl.removeTag = tagId => {
                    $ctrl.currentTagIds = $ctrl.currentTagIds.filter(id => id !== tagId);
                    updateTagsAvailable();
                };

                $ctrl.addTag = () => {

                    let remainingTags = $ctrl.allTags.filter(t => !$ctrl.currentTagIds.some(id => id === t.id));

                    utilityService.openSelectModal(
                        {
                            label: "Add Sort Tag",
                            options: remainingTags,
                            saveText: "Add",
                            validationText: "Please select a tag."

                        },
                        (tagId) => {
                            if (!tagId) {
                                return;
                            }

                            $ctrl.currentTagIds.push(tagId);

                            updateTagsAvailable();
                        });

                };

                $ctrl.$onInit = () => {
                    if ($ctrl.currentTagIds == null) {
                        $ctrl.currentTagIds = [];
                    }
                    $ctrl.currentTagIds = $ctrl.currentTagIds.filter(id => $ctrl.allTags.some(t => t.id === id));
                    updateTagsAvailable();
                };
            }
        });
}());