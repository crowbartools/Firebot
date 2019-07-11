"use strict";

angular.module('firebotApp').
    directive('draggablemodal', function() {
        return {
            restrict: 'C',
            link: function (_, elem) {
                elem.draggable({
                    revert: "invalid",
                    handle: ".modal-header"
                });
            }
        };
    });