"use strict";
(function() {
    //This handles the Settings tab
    angular
        .module("firebotApp")
        .controller("settingsController", function($scope, settingsService) {
            $scope.settings = settingsService;

            $scope.categories = [
                {
                    name: "General",
                    description: "Various settings for appearance, beta notifications, and more.",
                    icon: "fa-sliders-v-square",
                    template: "<general-settings />"
                },
                {
                    name: "Setups",
                    description: "Share your best creations with others. Or import others!",
                    icon: "fa-box-full",
                    template: "<setups-settings />"
                },
                {
                    name: "Triggers",
                    description: "Tweak the behaviors of various triggers (commands, events, etc)",
                    icon: "fa-bolt",
                    template: "<trigger-settings />"
                },
                {
                    name: "Effects",
                    description: "Various options for effects",
                    icon: "fa-magic",
                    template: "<effect-settings />"
                },
                {
                    name: "Database",
                    description: "Options and tools for the viewer database.",
                    icon: "fa-database",
                    template: "<database-settings />"
                },
                {
                    name: "Overlay",
                    description: "Add new fonts, create new instances, and other overlay settings.",
                    icon: "fa-tv",
                    template: "<overlay-settings />"
                },
                {
                    name: "Integrations",
                    description: "Link Firebot to a growing list of third party tools and apps.",
                    icon: "fa-globe",
                    template: "<integration-settings />"
                },
                {
                    name: "TTS",
                    description: "Settings for the default TTS voice.",
                    icon: "fa-volume",
                    template: "<tts-settings />"
                },
                {
                    name: "Backups",
                    description: "Manage backups and backup settings to ensure your data is never lost.",
                    icon: "fa-file-archive",
                    template: "<backups-settings />"
                },
                {
                    name: "Scripts",
                    description: "Configure script settings, add start up scripts, and more.",
                    icon: "fa-code",
                    template: "<scripts-settings />"
                },
                {
                    name: "Advanced",
                    description: "Various advanced settings such as debug mode, while loops, and other tools",
                    icon: "fa-tools",
                    template: "<advanced-settings />"
                }
            ];

            $scope.selectedCategory = $scope.categories[0];
            $scope.setSelectedCategory = (category) => {
                $scope.selectedCategory = category;
            };

            if (settingsService.getSetting("AutoUpdateLevel") > 3) {
                settingsService.saveSetting("AutoUpdateLevel", 3);
            }
        });
}());