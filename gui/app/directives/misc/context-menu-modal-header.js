"use strict";

(function() {
    angular.module("firebotApp")
        .component("contextMenuModalHeader", {
            bindings: {
                triggerType: "@",
                triggerName: "<",
                sortTags: "<",
                onClose: "&",
                showTriggerName: "<"
            },
            template: `
            <div class="modal-header context-menu-modal-header sticky-header">
                <button
                    type="button"
                    class="close"
                    aria-label="Close"
                    ng-click="$ctrl.onClose()"
                >
                    <span aria-hidden="true">&times;</span>
                </button>
                <span
                    class="noselect clickable context-menu"
                    context-menu="$ctrl.getContextMenu()"
                    context-menu-on="click"
                    context-menu-orientation="left"
                >
                    <i class="fal fa-ellipsis-v"></i>
                </span>
                <h4 class="modal-title">
                    <span class="action">{{$ctrl.triggerName ? 'Edit' : 'Add New'}} {{$ctrl.triggerType}}</span>
                    <span ng-if="$ctrl.triggerName && $ctrl.showTriggerName">- {{$ctrl.triggerName}}</span>
                </h4>
            </div>

            `,
            controller: function (sortTagsService) {
                const $ctrl = this;

                $ctrl.$onInit = () => {
                    $ctrl.sortTagContext = $ctrl.triggerType + "s";
                };

                $ctrl.getContextMenu = () => {
                    const menuItems = [];

                    if ($ctrl.sortTagContext != null) {
                        const allSortTags = sortTagsService.getSortTags($ctrl.sortTagContext);

                        if (allSortTags.length > 0) {
                            menuItems.push({
                                text: "Sort tags...",
                                children: allSortTags.map(st => {
                                    const isSelected = $ctrl.sortTags && $ctrl.sortTags.includes(st.id);
                                    return {
                                        html: `<a href><i class="${isSelected ? 'fas fa-check' : ''}" style="margin-right: ${isSelected ? '10' : '27'}px;"></i> ${st.name}</a>`,
                                        click: () => {
                                            $ctrl.toggleSortTag(st.id);
                                        }
                                    };
                                }),
                                hasTopDivider: false
                            });
                        }
                    }

                    return menuItems;
                };

                $ctrl.toggleSortTag = (tagId) => {
                    if ($ctrl.sortTags.includes(tagId)) {
                        $ctrl.sortTags = $ctrl.sortTags.filter(id => id !== tagId);
                    } else {
                        $ctrl.sortTags.push(tagId);
                    }
                };
            }
        });
}());
