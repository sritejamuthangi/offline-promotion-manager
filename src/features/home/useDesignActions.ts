import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { Design } from '@/core/schema';
import { designRepository } from '@/storage';

/** Design actions with user feedback (toasts) and error handling built in. */
export function useDesignActions() {
  const { t } = useTranslation();

  return useMemo(() => {
    const fail = (error: unknown) => {
      console.error(error);
      toast.error(t('design.actionFailed'));
    };

    return {
      async rename(design: Design, name: string): Promise<boolean> {
        try {
          await designRepository.rename(design.id, name);
          toast.success(t('design.renamed'));
          return true;
        } catch (error) {
          fail(error);
          return false;
        }
      },

      async duplicate(design: Design): Promise<void> {
        try {
          await designRepository.duplicate(design.id, t('design.copyName', { name: design.name }));
          toast.success(t('design.duplicated'));
        } catch (error) {
          fail(error);
        }
      },

      async remove(design: Design): Promise<void> {
        try {
          await designRepository.remove(design.id);
          toast(t('design.deleted'), {
            action: {
              label: t('common.undo'),
              onClick: () => {
                designRepository.restore(design.id).catch(fail);
              },
            },
          });
        } catch (error) {
          fail(error);
        }
      },

      async restore(design: Design): Promise<void> {
        try {
          await designRepository.restore(design.id);
          toast.success(t('design.restored'));
        } catch (error) {
          fail(error);
        }
      },

      async destroy(design: Design): Promise<void> {
        try {
          await designRepository.destroy(design.id);
          toast.success(t('design.destroyed'));
        } catch (error) {
          fail(error);
        }
      },
    };
  }, [t]);
}
