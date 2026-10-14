let lockCount = 0;

/**
 * Increments the lock count and disables body scrolling when first modal opens.
 */
export function lockBodyScroll() {
  lockCount++;
  if (lockCount === 1) {
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Decrements the lock count and restores body scrolling when all modals are closed.
 */
export function unlockBodyScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = '';
  }
}

/**
 * Resets lock count and unconditionally restores body scrolling.
 */
export function resetBodyScroll() {
  lockCount = 0;
  document.body.style.overflow = '';
}
