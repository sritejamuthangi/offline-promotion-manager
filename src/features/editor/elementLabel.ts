import type { TFunction } from 'i18next';
import type { DesignElement } from '@/core/schema';

export function elementLabel(element: DesignElement, t: TFunction): string {
  if (element.name) return element.name;
  if (element.type === 'text') return element.text.trim().slice(0, 50) || t('editor.text');
  if (element.type === 'shape') return t(`editor.shapes.${element.shape}`);
  return t(`editor.${element.type}`);
}
