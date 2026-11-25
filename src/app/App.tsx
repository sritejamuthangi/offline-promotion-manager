import { RouterProvider } from '@tanstack/react-router';
import { useEffect } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { purgeExpiredDesigns } from '@/storage';
import { router } from './router';

export function App() {
  useEffect(() => {
    purgeExpiredDesigns().catch((error) => {
      console.warn('Could not clean up old deleted designs', error);
    });
  }, []);

  return (
    <TooltipProvider>
      <RouterProvider router={router} />
    </TooltipProvider>
  );
}
