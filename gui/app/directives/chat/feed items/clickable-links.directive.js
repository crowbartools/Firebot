"use strict";
(function() {

    const URL_REGEX = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)/i;

    /**
     * @param {string} input
     */
    function createHyperlink(input = "") {
        if (URL_REGEX.test(input)) {
            return {
                foundLink: true,
                text: input.replace(URL_REGEX, (url) => {
                    return `<a href="${url.startsWith("http") ? url : `https://${url}`}" target="_blank">${url}</a>`;
                })
            };
        }
        return {
            foundLink: false,
            text: input.trim()
        };
    }

    angular.module("firebotApp")
        .directive("clickableLinks", [
            "$compile",
            function() {
                return {
                    restrict: "E",
                    priority: 9999,
                    scope: {
                        text: "<"
                    },
                    link: function(scope, element) {
                        scope.text.split(" ")
                            .map(createHyperlink)
                            .reduce((acc, current) => {
                                if (!current.foundLink) {
                                    const previous = acc[acc.length - 1];
                                    if (previous == null || previous.type !== "text") {
                                        acc.push({
                                            text: current.text,
                                            type: "text"
                                        });
                                    } else {
                                        previous.text += ` ${current.text}`;
                                    }
                                } else {
                                    acc.push({
                                        type: "link",
                                        link: current.text
                                    });
                                }
                                return acc;
                            }, []).forEach(item => {
                                if (item.type === "text") {
                                    const textSpan = angular.element("<span></span>");
                                    textSpan.text(item.text + " ");
                                    element.append(textSpan);
                                } else if (item.type === "link") {
                                    // const linkSpan = angular.element("<span></span>");
                                    // linkSpan.html(`<span>${item.link} </span>`);
                                    element.append(`<span>${item.link} </span>`);
                                }
                            });
                    }
                };
            }
        ]);
}());