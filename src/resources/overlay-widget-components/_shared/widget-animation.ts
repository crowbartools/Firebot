import type { Animation } from "../../../types";

function play(el: Element, animation: Animation | null | undefined, done: () => void): void {
    const name = animation?.class;
    if (!name || name === "none") {
        done();
        return;
    }

    const element = el as HTMLElement;
    if (animation?.duration) {
        element.style.animationDuration = `${animation.duration}s`;
    }

    let safety: ReturnType<typeof setTimeout>;
    let settled = false;
    const finish = () => {
        if (settled) {
            return;
        }
        settled = true;
        clearTimeout(safety);
        element.removeEventListener("animationend", onEnd);
        element.classList.remove("animated", name);
        element.style.animationDuration = "";
        done();
    };
    const onEnd = (event: AnimationEvent) => {
        // Ignore animationend from child elements.
        if (event.target === element) {
            finish();
        }
    };

    element.addEventListener("animationend", onEnd);
    // Fallback in case animationend never fires (ie) an unrecognized animation class).
    safety = setTimeout(finish, (animation?.duration ?? 1) * 1000 + 200);
    element.classList.add("animated", name);
}

export function useWidgetAnimations(
    getEntry: () => Animation | null | undefined,
    getExit: () => Animation | null | undefined
) {
    return {
        onEnter: (el: Element, done: () => void) => play(el, getEntry(), done),
        onLeave: (el: Element, done: () => void) => play(el, getExit(), done)
    };
}
