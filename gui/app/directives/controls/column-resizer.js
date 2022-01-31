"use strict";

(function() {

    angular
        .module('firebotApp')
        .component("columnResizer", {
            bindings: {
                onUpdate: "&"
            },
            template: `<div class="resizer-hitbox"></div>`,
            controller: function($element) {
                const $ctrl = this;

                const $rightSide = $element.next();
                const $leftSide = $element.prev();
                const $parent = $element.parent();
                const $ghostbar = angular.element("<div id='ghostbar'></div>");

                const sidebarWidth = $('sidebar').width();
                let dragging = false;
                let start = 0;

                const positionGhostbar = () => {
                    $ghostbar.css({
                        height: $parent.height(),
                        top: $parent.position().top,
                        left: $rightSide.offset().left - sidebarWidth
                    });
                };

                $element.bind('mousedown', (e) => {
                    e.preventDefault();

                    dragging = true;
                    start = e.pageX;

                    positionGhostbar();
                    $parent
                        .append($ghostbar)
                        .bind('mousemove', (e) => {
                            $ghostbar.css("left", (e.pageX - sidebarWidth) + 2);
                        });
                });

                const getRelativeWidth = (width) => {
                    return (width / $parent.width()) * 100;
                };

                const updateSettings = (leftWidth, rightWidth) => {
                    const updatedSettings = {};
                    updatedSettings[$leftSide.attr("id")] = leftWidth;
                    updatedSettings[$rightSide.attr("id")] = rightWidth;

                    $ctrl.onUpdate({ updatedSettings });
                };

                const updateWidths = (leftWidth, rightWidth) => {
                    $leftSide.css("width", leftWidth);
                    $rightSide.css("width", rightWidth);

                    updateSettings(leftWidth, rightWidth);
                };

                $parent.bind('mouseup', (e) => {
                    if (dragging) {
                        const difference = getRelativeWidth(e.pageX - start);
                        const leftWidth = getRelativeWidth($leftSide.width()) + difference + "%";
                        const rightWidth = getRelativeWidth($rightSide.width()) - difference + "%";

                        updateWidths(leftWidth, rightWidth);

                        $ghostbar.remove();
                        $parent.unbind('mousemove');
                        dragging = false;
                    }
                });
            }
        });
}());
