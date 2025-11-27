import type { EffectType } from "../../../types/effects";

const effect: EffectType<{
    effectComment: string;
}> = {
    definition: {
        id: "firebot:comment",
        name: "Comment",
        description: "Add a comment to your effect list (does nothing when triggered)",
        icon: "fad fa-comment-alt-lines",
        categories: ["common"],
        dependencies: [],
        isNoOp: true
    },
    optionsTemplate: `
        <eos-container>
            <p>This effect does nothing when triggered. Use it to add comments to your effect list.</p>
        </eos-container>

        <eos-container pad-top="true">
            <div class="form-group">
                <label class="control-label">Comment</label>
                <textarea
                    class="form-control"
                    rows="4"
                    ng-model="effect.effectComment"
                    placeholder="Enter your comment here..."
                    style="resize: vertical;"
                ></textarea>
            </div>
        </eos-container>
    `,
    optionsController: ($scope) => {
        if ($scope.effect.effectComment == null) {
            $scope.effect.effectComment = "";
        }
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];

        if (effect.effectComment == null || effect.effectComment.trim() === "") {
            errors.push("Comment cannot be empty.");
        }

        return errors;
    },
    onTriggerEvent: () => {
        // No-op: This effect does nothing when triggered
        return Promise.resolve(true);
    }
};

export = effect;


