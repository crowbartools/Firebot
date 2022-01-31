"use strict";

(function() {

    angular
        .module('firebotApp')
        .component("resizer", {
            controller: function($document, $element) {
                const $rightSide = $element.next();
                const $leftSide = $element.prev();
                const $parent = $element.parent();

                let start = 0;
                let dragging = false;

                const $ghostbar = angular.element("<div id='ghostbar'></div>");
                $element.bind('mousedown', (e) => {
                    e.preventDefault();
                    dragging = true;

                    start = e.pageX;

                    $ghostbar.css({
                        height: $parent.height(),
                        top: $parent.position().top,
                        left: $rightSide.offset().left - 223
                    });

                    $parent.append($ghostbar);

                    $parent.bind('mousemove', (e) => {
                        $ghostbar.css("left", (e.pageX - 223) + 2);
                    });
                });

                const getRelativeWidth = (width) => {
                    return (width / $parent.width()) * 100;
                };

                $document.bind('mouseup', (e) => {
                    if (dragging) {
                        const end = e.pageX;
                        let difference = end - start;
                        let percentage = getRelativeWidth(difference);

                        $leftSide.css("width", getRelativeWidth($leftSide.width()) + percentage + "%");
                        $rightSide.css("width", (getRelativeWidth($rightSide.width()) - percentage) + "%");

                        $ghostbar.remove();
                        $document.unbind('mousemove');
                        dragging = false;
                    }
                });
            }
        });
}());
