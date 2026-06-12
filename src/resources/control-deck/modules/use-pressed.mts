import { ref } from 'vue';

export function usePressed({ minDuration = 100 } = {}) {
  const pressed = ref(false);
  let pressedAt = 0;
  let releaseTimer = null;

  function onPointerDown() {
    clearTimeout(releaseTimer);
    pressedAt = performance.now();
    pressed.value = true;
  }

  function release() {
    const elapsed = performance.now() - pressedAt;
    const remaining = Math.max(0, minDuration - elapsed);
    releaseTimer = setTimeout(() => {
      pressed.value = false;
    }, remaining);
  }

  // Spread onto the element
  const pressedHandlers = {
    onPointerdown: onPointerDown,
    onPointerup: release,
    onPointercancel: release,
    onPointerleave: release,
  };

  return { pressed, pressedHandlers };
}