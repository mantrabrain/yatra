/**
 * Prepare the DOM before opening wp.media() so the modal is visible and focus/ARIA stay valid.
 * WordPress may set aria-hidden on #wpwrap while the trigger button still has focus.
 */
export function prepareWordPressMediaFrameOpen(): void {
  const active = document.activeElement;
  if (active instanceof HTMLElement) {
    active.blur();
  }
  document.getElementById("wpwrap")?.removeAttribute("aria-hidden");
}
