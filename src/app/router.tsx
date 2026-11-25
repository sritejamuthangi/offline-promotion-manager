import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
} from '@tanstack/react-router';
import { HomePage } from '@/features/home/HomePage';
import { AppLayout, RootLayout } from './layouts';
import { NotFoundPage } from './NotFoundPage';

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});

/** Pages with the regular header and footer. */
const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  component: AppLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/',
  component: HomePage,
});

// Screens other than home load on demand, so the first visit downloads less.
const settingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings',
  component: lazyRouteComponent(() => import('@/features/settings/SettingsPage'), 'SettingsPage'),
});

/** The design workspace uses the whole screen, without the regular header and footer. */
const designRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/design/$designId',
  component: lazyRouteComponent(() => import('@/features/design/DesignPage'), 'DesignPage'),
});

const routeTree = rootRoute.addChildren([
  appLayoutRoute.addChildren([homeRoute, settingsRoute]),
  designRoute,
]);

export const router = createRouter({
  routeTree,
  // Hash URLs (/#/design/123) work on any static host and sub-folder without server rules.
  history: createHashHistory(),
  defaultPreload: 'intent',
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
