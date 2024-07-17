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
    <eos-container header="Chapter" style="margin-top: 10px;">
        <firebot-input input-title="Chapter Name" model="effect.chapterName"></firebot-input>
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
