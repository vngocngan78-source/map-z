/**
 * China 3D Map — Tooltip Manager
 * 
 * Manages the HTML tooltip that follows the mouse and shows province/city info.
 */

export class TooltipManager {
  constructor(elementId = 'tooltip') {
    this.element = document.getElementById(elementId);
    this.visible = false;
  }

  show(x, y, content) {
    if (!this.element) return;

    this.element.innerHTML = content;
    this.element.style.left = x + 'px';
    this.element.style.top = y + 'px';
    this.element.classList.add('visible');
    this.element.classList.remove('hidden');
    this.visible = true;
  }

  hide() {
    if (!this.element) return;
    this.element.classList.remove('visible');
    this.element.classList.add('hidden');
    this.visible = false;
  }

  updatePosition(x, y) {
    if (!this.element || !this.visible) return;
    this.element.style.left = x + 'px';
    this.element.style.top = y + 'px';
  }
}
