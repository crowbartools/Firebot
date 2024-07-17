import { EffectType } from "../../../../../types/effects";
import { createRecordChapter } from "../obs-remote";

export const CreateRecordChapter: EffectType<{
    chapterName: string;
}> = {
    definition: {
        id: "firebot:obs-create-recording-chapter",
        name: "Create OBS Recording Chapter Marker",
        description: "Adds a chapter marker to an OBS",
        icon: "far fa-bookmark",
        categories: ["common"]
    },
    optionsTemplate: `
    <eos-container header="Chapter">
        <p class="help-block">
            Note: This effect requires OBS 30.2 or later and a supported video format.
        </p>
        <firebot-input input-title="Chapter Name" menu-position="under" model="effect.chapterName"></firebot-input>
    </eos-container>
    `,
    optionsValidator: (effect) => {
        if (effect.chapterName == null || effect.chapterName.length === 0) {
            return ["Please enter a chapter name."];
        }
        return [];
    },
    onTriggerEvent: async ({ effect }) => {
        await createRecordChapter(effect.chapterName);
        return true;
    }
};
