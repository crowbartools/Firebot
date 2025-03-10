"use strict";

(function() {
    angular.module("firebotApp")
        .component("sortTagsRow", {
            bindings: {
                context: "<",
                item: "=",
                onUpdate: "&"
            },
            template: `
                <div
                    style="display: flex; position: relative;"
                    uib-popover-template="'sortTagsPopover.html'"
                    popover-is-open="$ctrl.isPopupVisible"
                    popover-placement="auto bottom-left"
                    popover-append-to-body="true"
                    popover-trigger="'outsideClick'"
                >
                    <div class="sort-tags p-px" ng-class="{ 'hidden-tags': hasOverflow() }">
                        <span ng-repeat="tag in getSortTags() track by tag.id" class="sort-tag mr-2">
                            <span class="mb-px">{{tag.name}}</span>
                        </span>
                        <button
                            role="button"
                            class="sort-tag-add mb-px"
                            aria-label="Add tag"
                        >
                            <i class="far fa-plus"></i>
                        </button>
                    </div>
                    <div style="position: absolute;" ng-show="hasOverflow()" uib-tooltip-html="getSortTagNames()">
                        <button
                            role="button"
                            class="sort-tag-add mb-px"
                            aria-label="Edit tags"
                        >
                            {{getSortTags().length}} tags <i class="far fa-chevron-right"></i>
                        </button>
                    </div>
                    <script type="text/ng-template" id="sortTagsPopover.html">
                        <div style="max-height: 315px; min-width: 175px; max-width: 225px; overflow-y: auto; overflow-x: hidden; padding: 10px 10px 0;">
                            <label
                                ng-repeat="tag in sts.getSortTags($ctrl.context) track by tag.id"
                                class="control-fb control--checkbox"
                                style="max-width: 200px; min-width: 150px;"
                            > {{tag.name}}
                                <input type="checkbox" ng-click="$ctrl.toggleSortTag(tag)" ng-checked="$ctrl.item.sortTags.includes(tag.id)">
                                <div class="control__indicator"></div>
                            </label>
                            <div class="button mb-2" ng-click="editSortTags()" ng-if="sts.getSortTags($ctrl.context).length === 0">
                                Add tags
                            </div>
                            <hr class="divider mt-1 mb-1" ng-if="sts.getSortTags($ctrl.context).length > 0" />
                            <div class="button mt-4 mb-2" ng-click="editSortTags()" ng-if="sts.getSortTags($ctrl.context).length > 0">
                                Add/edit tags
                            </div>
                        </div>
                    </script>
                </div>
            `,
            controller: function($scope, $element, sortTagsService) {
                const $ctrl = this;

                $ctrl.isPopupVisible = false;

                $scope.editSortTags = () => {
                    $ctrl.isPopupVisible = false;
                    sortTagsService.showEditSortTagsModal($ctrl.context);
                };

                $scope.getSortTags = () => sortTagsService.getSortTagsForItem($ctrl.context, $ctrl.item.sortTags);

                $scope.getSortTagNames = () => $scope.getSortTags().map(t => t.name).join("<br>");

                $scope.getOverflowTagCount = () => {
                    const allTags = $element.find(".sort-tags").children().toArray();
                    return Math.max(allTags.reduce((acc, child) => {
                        const parent = child.parentNode;
                        if ((child.offsetLeft - parent.offsetLeft > parent.offsetWidth) ||
                                (child.offsetTop - parent.offsetTop > parent.offsetHeight)) {
                            acc++;
                        }
                        return acc;
                    }, 0), 0);
                };

                $scope.hasOverflow = () => {
                    return $scope.getOverflowTagCount() > 0;
                };

                $scope.sts = sortTagsService;

                $ctrl.removeSortTag = (tagId) => {
                    $ctrl.item.sortTags = $ctrl.item.sortTags.filter(id => id !== tagId);
                    $ctrl.onUpdate();
                };

                $ctrl.addSortTag = (sortTag) => {
                    if (!$ctrl.item.sortTags?.some(id => id === sortTag.id)) {
                        if ($ctrl.item.sortTags == null) {
                            $ctrl.item.sortTags = [];
                        }
                        $ctrl.item.sortTags.push(sortTag.id);
                        $ctrl.onUpdate();
                    }
                };

                $ctrl.toggleSortTag = (sortTag) => {
                    if ($ctrl.item.sortTags?.some(id => id === sortTag.id)) {
                        $ctrl.removeSortTag(sortTag.id);
                    } else {
                        $ctrl.addSortTag(sortTag);
                    }
                };

                $ctrl.$onInit = () => {
                    if ($ctrl.item.sortTags == null) {
                        $ctrl.item.sortTags = [];
                    }
                };
            }
        });
}());