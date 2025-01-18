"use strict";

const { EffectCategory } = require("../../../../../shared/effect-constants");
const logger = require("../../../../logwrapper");
const integrationManager = require("../../../integration-manager");

/**
 * The Delay effect
 */
const effect = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "streamlabs:roll-credits",
        name: "Roll Credits",
        description: "Trigger StreamLab's Roll Credits feature",
        icon: "fad fa-align-center",
        categories: [EffectCategory.INTEGRATIONS],
        dependencies: []
    },
    /**
   * Global settings that will be available in the Settings tab
   */
    globalSettings: {},
    /**
   * The HTML template for the Options view (ie options when effect is added to something such as a button.
   * You can alternatively supply a url to a html file via optionTemplateUrl
   */
    optionsTemplate: `
        <eos-container>
            <div class="effect-info alert alert-info">
                This will trigger StreamLabs Roll Credits feature.
            </div>
        </eos-container>
    `,
    /**
   * The controller for the front end Options
   */
    optionsController: () => {},
    /**
   * When the effect is saved
   */
    optionsValidator: () => {
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: async () => {
        const streamlabs = integrationManager.getIntegrationDefinitionById("streamlabs");
        const accessToken = streamlabs.auth && streamlabs.auth["access_token"];

        if (accessToken) {
            try {
                const response = await fetch("https://streamlabs.com/api/v1.0/credits/roll",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ "access_token": accessToken })
                    });

                if (response.ok) {
                    return true;
                }

                throw new Error(`Request failed with status ${response.status}`);
            } catch (error) {
                logger.error("Failed to roll Streamlabs credits", error.message);
                return false;
            }
        }
    }
};

module.exports = effect;
