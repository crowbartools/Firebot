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

                const getColumnData = ($column) => {
                    return {
                        id: $column.attr("id") || null,
                        element: $column,
                        minWidth: parseInt($column.css("min-width").replace("px", ""))
                    };
                };

                const leftSide = getColumnData($element.prev());
                const rightSide = getColumnData($element.next());
                const $parent = $element.parent();
                const $ghostbar = angular.element("<div id='ghostbar'></div>");

                const sidebarWidth = $('sidebar').width();

                const positionGhostbar = () => {
                    $ghostbar.css({
                        height: $parent.height(),
                        top: $parent.position().top,
                        left: rightSide.element.offset().left - sidebarWidth
                    });
                };

                let dragging = false;
                let start = 0;
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

                const getAllColumnData = () => {
                    const columns = [];
                    $.each($parent.children().not('column-resizer'), (_, el) => {
                        columns.push(getColumnData($(el)));
                    });

                    return columns;
                };

                const getResizableColumnData = () => {
                    const columns = [];
                    $.each($('column-resizer'), (index, el) => {
                        if (index === 0) {
                            const $firstCol = $(el).prev();
                            columns.push(getColumnData($firstCol));
                        }

                        const $col = $(el).next();
                        if ($col) {
                            columns.push(getColumnData($col));
                        }
                    });

                    return columns;
                };

                const getTotalResizersWidth = () => {
                    let total = 0;
                    $.each($('column-resizer'), (_, el) => {
                        total += $(el).width();
                    });

                    return total;
                };

                const getRelativeWidth = (width) => {
                    return (width / $parent.width()) * 100;
                };

                const updateSettings = (leftWidth, rightWidth) => {
                    const updatedSettings = {};
                    updatedSettings[leftSide.id] = leftWidth;
                    updatedSettings[rightSide.id] = rightWidth;

                    $ctrl.onUpdate({ updatedSettings });
                };

                const updateWidths = (leftWidth, rightWidth) => {
                    leftSide.element.css("width", leftWidth);
                    rightSide.element.css("width", rightWidth);

                    updateSettings(leftWidth, rightWidth);
                };

                const findDropColumn = (position) => {
                    const allColumns = getResizableColumnData();
                    let dropColumn = {};
                    const areas = {};

                    let total = 0;
                    Object.values(allColumns).forEach(c => {
                        areas[c.id] = {
                            start: total,
                            end: total + c.element.width()
                        };

                        total += c.element.width();
                    });

                    Object.entries(areas).forEach(([key, value]) => {
                        if (position > value.start && position < value.end) {
                            dropColumn = allColumns.find(c => c.id === key);
                        }
                    });

                    return dropColumn;
                };

                const getMaxWidth = (side, otherSide) => {
                    const allColumns = getAllColumnData().filter(c => c.id !== side.id);

                    let totalMinWidth = 0;
                    allColumns.forEach(c => {
                        if (c.id === otherSide.id) {
                            totalMinWidth += c.minWidth;
                            return;
                        }
                        totalMinWidth += c.element.width();
                    });

                    return $parent.width() - getTotalResizersWidth() - totalMinWidth;
                };

                const isAlreadyMinOrMax = (difference) => {
                    const leftMaxWidth = getMaxWidth(leftSide, rightSide);
                    if (
                        difference > 0 &&
                        (
                            leftSide.element.width() >= leftMaxWidth ||
                            rightSide.element.width() <= rightSide.minWidth
                        )
                    ) {
                        return true;
                    }

                    const rightMaxWidth = getMaxWidth(rightSide, leftSide);
                    if (
                        difference < 0 &&
                        (
                            leftSide.element.width() <= leftSide.minWidth ||
                            rightSide.element.width() >= rightMaxWidth
                        )
                    ) {
                        return true;
                    }

                    return false;
                };

                const getLeftSideWidth = (difference) => {
                    let leftWidth = leftSide.element.width() + difference;

                    const leftMaxWidth = getMaxWidth(leftSide, rightSide);
                    if (leftWidth > leftMaxWidth) {
                        leftWidth = leftMaxWidth;
                    } else if (leftWidth < leftSide.minWidth) {
                        leftWidth = leftSide.minWidth;
                    }

                    return `${getRelativeWidth(leftWidth)}%`;
                };

                const getRightSideWidth = (difference) => {
                    let rightWidth = rightSide.element.width() - difference;

                    const rightMaxWidth = getMaxWidth(rightSide, leftSide);
                    if (rightWidth > rightMaxWidth) {
                        rightWidth = rightMaxWidth;
                    } else if (rightWidth < rightSide.minWidth) {
                        rightWidth = rightSide.minWidth;
                    }

                    return `${getRelativeWidth(rightWidth)}%`;
                };

                $parent.bind('mouseup', (e) => {
                    if (dragging) {
                        $ghostbar.remove();
                        $parent.unbind('mousemove');
                        dragging = false;

                        const position = e.pageX - sidebarWidth;
                        const dropColumn = findDropColumn(position);
                        const difference = e.pageX - start;

                        if (difference < 0 && dropColumn.id !== leftSide.id) {
                            return;
                        }

                        if (difference > 0 && dropColumn.id !== rightSide.id) {
                            return;
                        }

                        if (isAlreadyMinOrMax(difference)) {
                            return;
                        }

                        updateWidths(getLeftSideWidth(difference), getRightSideWidth(difference));
                    }
                });
            }
        });
}());
