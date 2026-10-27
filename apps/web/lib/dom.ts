/** True while any Radix dialog/alert-dialog is open (checked before handling keyboard shortcuts). */
export function isDialogOpen(): boolean {
  return document.querySelector('[role="dialog"]') !== null;
}
