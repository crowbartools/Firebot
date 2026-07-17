"use strict";

(function() {
    //const { PluginCategory, PluginCategoryLabels, PluginFeature, PluginFeatureLabels } = require("../../shared/plugin-constants");

    angular
        .module("firebotApp")
        .component("generateCommunityPluginManifestModal", {
            template: `
                <div class="modal-header sticky-header" style="border-bottom: 2px solid rgb(128 128 128 / 0.33);">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Generate Community Manifest</h4>
                </div>

                <div class="modal-body mx-4 my-8">
                    <h2>{{$ctrl.plugin.details.manifest.name}}</h2>

                    <p>This tool will help you generate a community plugin manifest that can be submitted to the <a href="https://github.com/crowbartools/firebot-plugins">Firebot community plugin repository</a>.</p>

                    <div class="effect-info alert alert-warning">
                        NOTE: This tool is only intended for the developer of a plugin planning to submit a manifest to the community plugin repository.
                        If you are not the author of this plugin, or you do not plan on publishing it, this tool is not for you.
                    </div>

                    <div ng-if="$ctrl.isValidPlugin === true">
                        <div class="form-group">
                            <h4 class="control-label">Plugin Category</h4>

                            <firebot-select
                                options="$ctrl.availableCategories"
                                selected="$ctrl.category"
                                style="margin-bottom: 5px;"
                                on-update="$ctrl.generateManifest()"
                            />
                        </div>

                        <div class="form-group">
                            <h4 class="control-label">Features</h4>

                            <multiselect-list
                                model="$ctrl.features"
                                options="$ctrl.availableFeatures"
                                settings="{ options: $ctrl.availableFeatures }"
                                on-update="$ctrl.generateManifest()"
                            />
                        </div>

                        <div class="form-group">
                            <h4 class="control-label">Tags</h4>

                            <editable-tags
                                model="$ctrl.tags"
                                settings="$ctrl.tagOptions"
                                on-update="$ctrl.generateManifest()"
                            ></editable-tags>
                        </div>

                        <div class="form-group">
                            <h4 class="control-label">Direct Download URL</h4>

                            <firebot-input
                                placeholder-text="Enter URL"
                                disable-variables="true"
                                model="$ctrl.downloadUrl"
                                on-input-update="$ctrl.generateManifest()"
                            />
                        </div>

                        <div class="form-group">
                            <h4 class="control-label">Release Date</h4>

                            <input
                                type="date"
                                class="form-control ng-animate-disabled"
                                placeholder="yyyy-MM-dd"
                                ng-model="$ctrl.releaseDate"
                                ng-change="$ctrl.generateManifest()"
                                disable-variable-menu="true"
                            >
                        </div>

                        <h3 class="mt-8">Suggested Manifest Path</h3>
                        <p>
                            This is a suggested file path for your community plugin manifest.
                            You do not need to use this exact path name when creating and submitting your community plugin manifest, but whatever file path you use must conform to the naming standards outlined in the <a href="https://github.com/crowbartools/firebot-plugins/blob/main/CONTRIBUTING.md">community plugin contribution guidelines</a>.
                        </p>
                        <div class="px-8 py-4" style="font-family: monospace; background-color: #0003">
                            {{$ctrl.suggestedManifestPath}}
                        </div>

                        <h3 class="mt-8">Community Plugin Manifest</h3>
                        <p>
                            Please review this manifest throughly <strong>BEFORE</strong> submitting.
                            It must fully conform to the <a href="https://github.com/crowbartools/firebot-plugins/blob/main/CONTRIBUTING.md">community plugin contribution guidelines</a>.
                            Also, once it has been approved and merged, <strong>it cannot be edited</strong>.
                        </p>

                        <firebot-button
                            text="Copy Manifest to Clipboard"
                            icon="far fa-copy"
                            type="primary"
                            ng-click="$ctrl.copyManifest()"
                        />

                        <div
                            ui-codemirror="{onLoad : $ctrl.codemirrorLoaded}"
                            ui-codemirror-opts="$ctrl.codemirrorSettings"
                            ng-model="$ctrl.generatedManifest"
                            class="mt-4"
                        ></div>
                    </div>

                    <div ng-if="$ctrl.isValidPlugin !== true" class="text-center mx-12">
                        This tool cannot automatically generate a community plugin manifest for the selected plugin.
                        {{$ctrl.validationFailureReason}}
                        Please review the <a href="https://github.com/crowbartools/firebot-plugins/blob/main/CONTRIBUTING.md">community plugin contribution guidelines</a> for more information on valid plugin manifest data.
                    </div>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function($rootScope, backendCommunicator) {
                const $ctrl = this;

                $ctrl.availableCategories = {
                    "stream-services": "Stream Services",
                    "social": "Social",
                    "music-media": "Music & Media",
                    "games": "Games/Gaming",
                    "overlays": "Overlays",
                    "tools-utilities": "Tools & Utilities"
                };

                $ctrl.availableFeatures = [
                    { id: "effects", name: "Effects" },
                    { id: "events", name: "Events" },
                    { id: "variables", name: "Variables" },
                    { id: "integrations", name: "Integrations" },
                    { id: "overlay-widgets", name: "Overlay Widgets" },
                    { id: "games", name: "Games" },
                    { id: "commands", name: "Commands" },
                    { id: "ui-extensions", name: "UI Extensions" }
                ];

                $ctrl.tagOptions = {
                    useTextArea: false,
                    addLabel: "Add Tag",
                    editLabel: "Edit Tag",
                    validationText: "Tag cannot be empty",
                    noDuplicates: true
                };

                $ctrl.plugin = null;
                $ctrl.isValidPlugin = true;
                $ctrl.validationFailureMessage = "";

                $ctrl.downloadUrl = "";
                $ctrl.releaseDate = new Date();
                $ctrl.category = "";
                $ctrl.features = [];
                $ctrl.tags = [];

                $ctrl.suggestedManifestPath = "";

                $ctrl.codemirrorSettings = {
                    mode: { name: "javascript", json: true },
                    theme: "blackboard",
                    lineNumbers: true,
                    autoRefresh: true,
                    showGutter: true,
                    readOnly: true
                };

                $ctrl.codemirrorLoaded = function(_editor) {
                    _editor.refresh();
                    const cmResize = require("cm-resize");
                    cmResize(_editor, {
                        minHeight: 400,
                        resizableWidth: false,
                        resizableHeight: true
                    });
                };

                $ctrl.getSafePathName = (item) => {
                    return (item ?? "")
                        .toLowerCase()
                        .replaceAll(/[^a-z0-9]+/g, "-")
                        .replaceAll(/^-+|-+$/g, "");
                };

                $ctrl.generateManifest = async () => {
                    $ctrl.isValidPlugin = true;
                    $ctrl.validationFailureMessage = "";

                    const safeAuthorName = $ctrl.getSafePathName($ctrl.plugin.details.manifest.author);
                    const safePluginName = $ctrl.getSafePathName($ctrl.plugin.details.manifest.name);

                    let safeVersion = null;
                    const semverRegex = /^((0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*))(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
                    const regexResult = semverRegex.exec($ctrl.plugin.details.manifest.version);
                    if (regexResult != null && regexResult.length > 1) {
                        safeVersion = regexResult[1];
                    } else {
                        $ctrl.isValidPlugin = false;
                        $ctrl.validationFailureMessage = "Your plugin has an invalid version string.";
                        return;
                    }

                    if (safeVersion !== $ctrl.plugin.details.manifest.version) {
                        $ctrl.isValidPlugin = false;
                        $ctrl.validationFailureMessage = "Preview plugin versions are not supported.";
                        return;
                    }

                    $ctrl.suggestedManifestPath = `manifests/${safeAuthorName}/${safePluginName}/${safeVersion}/manifest.json`;

                    const sha256 = await backendCommunicator.fireEventAsync("plugin-manager:get-plugin-hash", $ctrl.plugin.config.id);

                    $ctrl.generatedManifest = JSON.stringify({
                        name: $ctrl.plugin.details.manifest.name,
                        author: $ctrl.plugin.details.manifest.author,
                        description: $ctrl.plugin.details.manifest.description,
                        version: $ctrl.plugin.details.manifest.version,
                        downloadUrl: $ctrl.downloadUrl ?? "",
                        sha256: sha256,
                        releaseDate: $ctrl.releaseDate,
                        type: "single-file",

                        icon: $ctrl.plugin.details.manifest.icon,
                        category: $ctrl.category,
                        features: $ctrl.features ?? [],
                        tags: $ctrl.tags ?? [],
                        repo: $ctrl.plugin.details.manifest.repo,
                        website: $ctrl.plugin.details.manifest.website,
                        support: $ctrl.plugin.details.manifest.support,
                        minimumFirebotVersion: $ctrl.plugin.details.manifest.minimumFirebotVersion,
                        maximumFirebotVersion: $ctrl.plugin.details.manifest.maximumFirebotVersion
                    }, null, 4);
                };

                $ctrl.copyManifest = () => {
                    $rootScope.copyTextToClipboard($ctrl.generatedManifest, { show: true, message: "Copied community manifest to clipboard" });
                };

                $ctrl.$onInit = () => {
                    $ctrl.plugin = $ctrl.resolve.plugin ?? {
                        details: {
                            manifest: {}
                        }
                    };

                    $ctrl.generateManifest();
                };
            }
        });
}());