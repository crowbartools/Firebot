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
                <div class="sort-tags p-px">
                    <span ng-repeat="tag in sts.getSortTagsForItem($ctrl.context, $ctrl.item.sortTags) track by tag.id" class="sort-tag mr-2">
                        <span class="mb-px">{{tag.name}}</span>
                        <button role="button" ng-click="$ctrl.removeSortTag(tag.id)" aria-label="Remove tag" class="mb-px">
                            <i class="far fa-times"></i>
                        </button>
                    </span>
                    <button
                        role="button"
                        class="sort-tag-add mb-px"
                        aria-label="Add tag"
                        ng-click="$event.stopPropagation()"
                        context-menu="$ctrl.getSortTagsContextMenu()"
                        context-menu-on="click"
                        context-menu-orientation="right"
                        ng-show="$ctrl.getSortTagsContextMenu().length > 0"
                    >
                        <i class="far fa-plus"></i>
                    </button>
                </div>
            `,
            controller: function($scope, sortTagsService) {
                const $ctrl = this;

                $scope.sts = sortTagsService;

                $ctrl.removeSortTag = (tagId) => {
                    $ctrl.item.sortTags = $ctrl.item.sortTags.filter(id => id !== tagId);
                    $ctrl.onUpdate();
                };

                $ctrl.addSortTag = (sortTag) => {
                    if (!$ctrl.item.sortTags.some(id => id === sortTag.id)) {
                        $ctrl.item.sortTags.push(sortTag.id);
                        $ctrl.onUpdate();
                    }
                };

                $ctrl.getSortTagsContextMenu = () => {
                    if ($ctrl.item.sortTags == null) {
                        $ctrl.item.sortTags = [];
                    }

                    const sortTags = sortTagsService.getSortTags($ctrl.context).filter(st => !$ctrl.item.sortTags.includes(st.id));
                    return sortTags.map(st => {
                        return {
                            html: `<a href> ${st.name}</a>`,
                            click: () => {
                                $ctrl.addSortTag(st);
                            }
                        };
                    });
                };

                $ctrl.$onInit = () => {
                    if ($ctrl.item.sortTags == null) {
                        $ctrl.item.sortTags = [];
                    }
                };
            }
        });
}());