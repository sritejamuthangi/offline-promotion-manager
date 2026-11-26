import type { TFunction } from 'i18next';
import type { DesignElement } from '@/core/schema';
import { humanize } from '@/lib/humanize';

export function elementLabel(element: DesignElement, t: TFunction): string {
  if (element.name) return element.name;
  if (element.type === 'text') return element.text.trim().slice(0, 50) || t('editor.text');
  if (element.type === 'shape') return t(`editor.shapes.${element.shape}`);
  if (element.type === 'image') return element.alt || t('editor.image');
  if (element.type === 'qr') return t('editor.qrCode');
  if (element.type === 'grid') return t('editor.smartGrid');
  if (element.type === 'icon') return humanize(element.icon);
  if (element.type === 'sticker') return humanize(element.sticker);
  return t('editor.element');
}
