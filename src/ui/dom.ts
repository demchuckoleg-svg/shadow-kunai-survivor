/** Мелкие DOM-хелперы для UI-слоя. Зависимости: нет. */

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function button(className: string, label: string): HTMLButtonElement {
  const node = el('button', className, label);
  node.type = 'button';
  node.dataset.ui = 'interactive';
  return node;
}

export const SCREEN_CLASS =
  'fixed inset-0 z-50 flex flex-col bg-[#07070d]/95 backdrop-blur-md text-[#f4f4f8] select-none';
export const CARD_CLASS =
  'relative flex flex-col gap-1 rounded-2xl border p-3 text-left transition active:scale-[0.98]';
