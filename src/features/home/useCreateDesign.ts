import { useNavigate } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { createDesign } from '@/core/design/factory';
import { browserLocale } from '@/core/locale';
import type { Unit } from '@/core/units';
import { designRepository, requestPersistentStorage } from '@/storage';

export interface NewDesignSize {
  /** Page width in CSS px. */
  width: number;
  /** Page height in CSS px. */
  height: number;
  unit: Unit;
  presetId?: string;
}

/** Creates a blank design, saves it and opens it. */
export function useCreateDesign() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [creating, setCreating] = useState(false);

  const create = useCallback(
    async (size: NewDesignSize) => {
      setCreating(true);
      try {
        const design = createDesign({
          ...size,
          name: t('design.untitled'),
          locale: browserLocale(),
        });
        await designRepository.save(design);
        // Ask the browser to protect saved work from automatic clean-up (best effort).
        void requestPersistentStorage();
        await navigate({ to: '/design/$designId', params: { designId: design.id } });
      } catch (error) {
        console.error('Could not create the design', error);
        toast.error(t('design.createFailed'));
        setCreating(false);
      }
    },
    [navigate, t],
  );

  return { create, creating };
}
