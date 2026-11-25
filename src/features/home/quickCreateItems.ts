import type { PaperFamily } from '@/core/locale';
import type { PresetId } from '@/core/paper';

export type QuickCreateKey =
  | 'document'
  | 'poster'
  | 'flyer'
  | 'businessCard'
  | 'certificate'
  | 'socialPost'
  | 'story';

export interface QuickCreateItem {
  key: QuickCreateKey;
  presetId: PresetId;
}

/** The one-click sizes on the home screen, using the paper sizes people have locally. */
export function quickCreateItems(paper: PaperFamily): QuickCreateItem[] {
  const letter = paper === 'letter';
  return [
    { key: 'document', presetId: letter ? 'letter' : 'a4' },
    { key: 'poster', presetId: letter ? 'tabloid' : 'a3' },
    { key: 'flyer', presetId: letter ? 'half-letter' : 'a5' },
    { key: 'businessCard', presetId: letter ? 'business-card-us' : 'business-card-intl' },
    { key: 'certificate', presetId: letter ? 'certificate-letter' : 'certificate-a4' },
    { key: 'socialPost', presetId: 'instagram-post' },
    { key: 'story', presetId: 'story' },
  ];
}
