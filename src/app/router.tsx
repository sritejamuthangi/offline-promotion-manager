import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
} from '@tanstack/react-router';
import { BASE_PATH } from '@/config/site';
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

const templatesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/templates',
  // `?category=mine` opens the catalogue on the templates saved on this device.
  validateSearch: (search: Record<string, unknown>): { category?: string } =>
    typeof search.category === 'string' ? { category: search.category } : {},
  component: lazyRouteComponent(
    () => import('@/features/templates/TemplatesPage'),
    'TemplatesPage',
  ),
});

const templateCategoryRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/templates/category/$category',
  component: lazyRouteComponent(
    () => import('@/features/templates/TemplatesPage'),
    'TemplatesPage',
  ),
});

const templateRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/templates/$templateId',
  component: lazyRouteComponent(() => import('@/features/templates/TemplatePage'), 'TemplatePage'),
});

/** The design workspace uses the whole screen, without the regular header and footer. */
const designRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/design/$designId',
  component: lazyRouteComponent(() => import('@/features/design/DesignPage'), 'DesignPage'),
});

const routeTree = rootRoute.addChildren([
  appLayoutRoute.addChildren([
    homeRoute,
    templatesRoute,
    templateCategoryRoute,
    templateRoute,
    settingsRoute,
  ]),
  designRoute,
]);

// Old bookmarks remain usable after moving from hash URLs to crawlable paths.
if (window.location.hash.startsWith('#/')) {
  const path = window.location.hash.slice(1);
  if (!path.startsWith('//')) window.history.replaceState(null, '', `${BASE_PATH}${path}`);
}

export const router = createRouter({
  routeTree,
  history: createBrowserHistory(),
  basepath: BASE_PATH || '/',
  defaultPreload: 'intent',
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
