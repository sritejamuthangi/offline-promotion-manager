import { Link } from '@tanstack/react-router';
import { ImagePlus, LoaderCircle, Search, WifiOff } from 'lucide-react';
import { type FormEvent, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  LIBRARY_CATEGORIES,
  LIBRARY_GRAPHICS,
  type LibraryCategory,
  librarySrc,
} from '@/content/library';
import { IMAGE_PROVIDERS, type ImageProvider, type ImageSearchResult } from '@/core/imageSearch';
import type { Theme } from '@/core/schema';
import { useSettings } from '@/features/settings/settingsStore';
import { humanize } from '@/lib/humanize';
import { cn } from '@/lib/utils';
import { useAssetUrl } from '@/render/assetUrl';
import { libraryImageUrl } from '@/render/imageSource';
import { type AssetRecord, assetRepository } from '@/storage';
import { useImageAssets } from '@/storage/hooks';
import { SearchRateLimitError, saveSearchResult, searchImages } from './search';

/** What the person picked. `adaptive` graphics are redrawn to fill whatever they cover. */
export interface ImageChoice {
  src: string;
  width?: number;
  height?: number;
  alt?: string;
  adaptive?: boolean;
}

export type ImageTab = 'uploads' | 'library' | 'search';

const tileClass =
  'group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border bg-muted/40 outline-none transition hover:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60';

export function ImagePickerDialog({
  open,
  onOpenChange,
  onPick,
  theme,
  frame,
  initialTab = 'uploads',
  initialCategory = 'backgrounds',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (choice: ImageChoice) => void;
  /** Library graphics are previewed in the design's own colours. */
  theme: Theme;
  /** The shape the image will fill, so background previews match. */
  frame?: { width: number; height: number };
  initialTab?: ImageTab;
  initialCategory?: LibraryCategory;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<ImageTab>(initialTab);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setTab(initialTab);
  }
  const pick = (choice: ImageChoice) => {
    onPick(choice);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-4 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('images.title')}</DialogTitle>
          <DialogDescription>{t('images.description')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ToggleGroup
            type="single"
            value={tab}
            onValueChange={(value) => value && setTab(value as ImageTab)}
            aria-label={t('images.tabs')}
            className="max-w-full overflow-x-auto scrollbar-none"
          >
            <ToggleGroupItem value="uploads">{t('images.uploadsTab')}</ToggleGroupItem>
            <ToggleGroupItem value="library">{t('images.libraryTab')}</ToggleGroupItem>
            <ToggleGroupItem value="search">{t('images.searchTab')}</ToggleGroupItem>
          </ToggleGroup>
          <UploadButton onUploaded={pick} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pe-1">
          {tab === 'uploads' && <UploadsGrid onPick={pick} />}
          {tab === 'library' && (
            <LibraryGrid
              theme={theme}
              frame={frame}
              initialCategory={initialCategory}
              onPick={pick}
            />
          )}
          {tab === 'search' && <SearchPanel onPick={pick} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UploadButton({ onUploaded }: { onUploaded: (choice: ImageChoice) => void }) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label={t('images.upload')}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          if (!file.type.startsWith('image/')) {
            toast.error(t('editor.imageError'));
            return;
          }
          setBusy(true);
          assetRepository
            .add({ blob: file, name: file.name, type: file.type })
            .then((asset) => onUploaded(assetChoice(asset, file.name)))
            .catch(() => toast.error(t('editor.imageError')))
            .finally(() => setBusy(false));
        }}
      />
      <Button type="button" size="sm" disabled={busy} onClick={() => input.current?.click()}>
        <ImagePlus />
        {busy ? t('editor.uploading') : t('images.upload')}
      </Button>
    </>
  );
}

function assetChoice(asset: AssetRecord, alt?: string): ImageChoice {
  return {
    src: `asset:${asset.id}`,
    width: asset.width,
    height: asset.height,
    alt: alt ?? asset.source.title ?? asset.name,
  };
}

function UploadsGrid({ onPick }: { onPick: (choice: ImageChoice) => void }) {
  const { t } = useTranslation();
  const assets = useImageAssets();
  if (assets === undefined)
    return <p className="py-8 text-center text-muted-foreground text-sm">{t('common.loading')}</p>;
  if (!assets.length)
    return (
      <p className="rounded-lg border border-dashed px-6 py-10 text-center text-muted-foreground text-sm">
        {t('images.noUploads')}
      </p>
    );
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {assets.map((asset) => (
        <li key={asset.id}>
          <AssetTile asset={asset} onPick={() => onPick(assetChoice(asset))} />
        </li>
      ))}
    </ul>
  );
}

function AssetTile({ asset, onPick }: { asset: AssetRecord; onPick: () => void }) {
  const url = useAssetUrl(`asset:${asset.id}`);
  const label = asset.source.title ?? asset.name;
  return (
    <button type="button" className={tileClass} aria-label={label} title={label} onClick={onPick}>
      {url && <img src={url} alt="" draggable={false} className="size-full object-contain p-1" />}
    </button>
  );
}

function LibraryGrid({
  theme,
  frame,
  initialCategory,
  onPick,
}: {
  theme: Theme;
  frame?: { width: number; height: number };
  initialCategory: LibraryCategory;
  onPick: (choice: ImageChoice) => void;
}) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<LibraryCategory>(initialCategory);
  const graphics = LIBRARY_GRAPHICS.filter((graphic) => graphic.category === category);
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs">{t('images.libraryHint')}</p>
      <ToggleGroup
        type="single"
        value={category}
        onValueChange={(value) => value && setCategory(value as LibraryCategory)}
        aria-label={t('images.libraryTab')}
        className="max-w-full overflow-x-auto scrollbar-none"
      >
        {LIBRARY_CATEGORIES.map((key) => (
          <ToggleGroupItem key={key} value={key}>
            {t(`images.libraryCategories.${key}`)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {graphics.map((graphic) => {
          const name = humanize(graphic.id);
          const url = libraryImageUrl(
            graphic.id,
            theme.colors,
            graphic.adaptive ? (frame ?? { width: 1, height: 1 }) : undefined,
          );
          return (
            <li key={graphic.id}>
              <button
                type="button"
                className={tileClass}
                aria-label={name}
                title={name}
                onClick={() =>
                  onPick({
                    src: librarySrc(graphic.id),
                    width: graphic.width,
                    height: graphic.height,
                    alt: '',
                    adaptive: graphic.adaptive,
                  })
                }
              >
                {url && (
                  <img
                    src={url}
                    alt=""
                    draggable={false}
                    className={cn(
                      'size-full',
                      graphic.adaptive ? 'object-cover' : 'object-contain p-2',
                    )}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function subscribeOnline(onChange: () => void) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | {
      status: 'done';
      query: string;
      results: ImageSearchResult[];
      next?: number;
      more?: boolean;
    }
  | { status: 'error'; rateLimited: boolean };

function SearchPanel({ onPick }: { onPick: (choice: ImageChoice) => void }) {
  const { t } = useTranslation();
  const enabled = useSettings((s) => s.imageSearch);
  const provider = useSettings((s) => s.imageProvider);
  const setProvider = useSettings((s) => s.setImageProvider);
  const commercialOnly = useSettings((s) => s.imageCommercialOnly);
  const setCommercialOnly = useSettings((s) => s.setImageCommercialOnly);
  const online = useOnline();
  const queryId = useId();
  const providerId = useId();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const [adding, setAdding] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const download = useRef<AbortController | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Changing any search option invalidates in-flight requests and their results.
  useEffect(() => {
    controller.current?.abort();
    download.current?.abort();
    setState({ status: 'idle' });
    setAdding(null);
    return () => {
      controller.current?.abort();
      download.current?.abort();
    };
  }, [provider, commercialOnly, enabled]);

  const run = (next?: { query: string; cursor: number; previous: ImageSearchResult[] }) => {
    const words = next?.query ?? query.trim();
    if (!words || !enabled || !online) return;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    if (next && state.status === 'done') setState({ ...state, more: true });
    else setState({ status: 'loading' });
    searchImages(provider, words, next?.cursor, { commercialOnly }, abort.signal)
      .then((page) => {
        if (abort.signal.aborted) return;
        const results = [...(next?.previous ?? []), ...page.results];
        setState({
          status: 'done',
          query: words,
          results: [
            ...new Map(
              results.map((result) => [`${result.provider}:${result.id}`, result]),
            ).values(),
          ],
          next: page.next,
        });
      })
      .catch((error: unknown) => {
        if (abort.signal.aborted) return;
        setState({ status: 'error', rateLimited: error instanceof SearchRateLimitError });
      });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    run();
  };

  const add = async (result: ImageSearchResult) => {
    if (!enabled || !online || adding) return;
    const abort = new AbortController();
    download.current = abort;
    setAdding(result.id);
    const credit = result.creator
      ? t('images.credit.line', {
          title: result.title,
          creator: result.creator,
          license: result.license,
        })
      : t('images.credit.lineNoCreator', { title: result.title, license: result.license });
    try {
      const asset = await saveSearchResult(result, credit, abort.signal);
      if (abort.signal.aborted) return;
      onPick(assetChoice(asset, result.title));
    } catch {
      if (!abort.signal.aborted) toast.error(t('images.downloadError'));
    } finally {
      if (!abort.signal.aborted) setAdding(null);
    }
  };

  if (!enabled)
    return (
      <div className="rounded-lg border border-dashed px-6 py-10 text-center text-sm">
        <p className="text-muted-foreground">{t('images.disabled')}</p>
        <Link to="/settings" className="mt-2 inline-block font-medium text-primary hover:underline">
          {t('images.openSettings')}
        </Link>
      </div>
    );

  const providerName = t(`images.providers.${provider}`);
  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
        <div className="grid min-w-48 flex-1 gap-1.5">
          <Label htmlFor={queryId} className="text-xs">
            {t('images.searchLabel')}
          </Label>
          <Input
            id={queryId}
            type="search"
            value={query}
            maxLength={200}
            placeholder={t('images.searchPlaceholder')}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={providerId} className="text-xs">
            {t('images.provider')}
          </Label>
          <NativeSelect
            id={providerId}
            value={provider}
            wrapperClassName="w-44"
            onChange={(event) => {
              setProvider(event.target.value as ImageProvider);
              setState({ status: 'idle' });
            }}
          >
            {IMAGE_PROVIDERS.map((key) => (
              <option key={key} value={key}>
                {t(`images.providers.${key}`)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit" disabled={!query.trim() || !online || state.status === 'loading'}>
          <Search />
          {t('images.searchButton')}
        </Button>
      </form>
      {provider === 'openverse' && (
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={commercialOnly}
            onChange={(event) => setCommercialOnly(event.target.checked)}
          />
          {t('images.commercialOnly')}
        </label>
      )}
      <p className="text-muted-foreground text-xs">
        {t('images.privacyNote', { provider: providerName })}
      </p>

      {!online && (
        <p className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm" role="status">
          <WifiOff className="size-4 shrink-0" aria-hidden="true" />
          {t('images.offline')}
        </p>
      )}
      {state.status === 'idle' && online && (
        <p className="py-6 text-center text-muted-foreground text-sm">{t('images.searchPrompt')}</p>
      )}
      {state.status === 'loading' && (
        <p className="flex items-center justify-center gap-2 py-6 text-sm" role="status">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          {t('images.searching')}
        </p>
      )}
      {state.status === 'error' && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm">
          {state.rateLimited ? t('images.rateLimited') : t('images.error')}
        </p>
      )}
      {state.status === 'done' && !state.results.length && (
        <p className="py-6 text-center text-muted-foreground text-sm">
          {t('images.noResults', { query: state.query })}
        </p>
      )}
      {state.status === 'done' && state.results.length > 0 && (
        <>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-busy={adding !== null}>
            {state.results.map((result) => (
              <li key={`${result.provider}-${result.id}`}>
                <button
                  type="button"
                  className={cn(tileClass, 'bg-muted')}
                  disabled={adding !== null || !online}
                  aria-label={t('images.resultLabel', {
                    title: result.title,
                    creator: result.creator ?? t('images.unknownCreator'),
                    license: result.license,
                  })}
                  title={result.title}
                  onClick={() => void add(result)}
                >
                  <img
                    src={result.thumbnailUrl}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    draggable={false}
                    className="size-full object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1.5 py-0.5 text-start text-[10px] text-white">
                    {result.license}
                  </span>
                  {adding === result.id && (
                    <span className="absolute inset-0 flex items-center justify-center bg-background/70 text-xs">
                      <LoaderCircle className="me-1 size-4 animate-spin" aria-hidden="true" />
                      {t('images.adding')}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          {state.next !== undefined && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                disabled={state.more || !online}
                onClick={() =>
                  state.next !== undefined &&
                  run({ query: state.query, cursor: state.next, previous: state.results })
                }
              >
                {state.more ? t('images.searching') : t('images.loadMore')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
