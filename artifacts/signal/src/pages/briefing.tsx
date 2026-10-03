import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import {
  getGetBriefingQueryKey,
  useGetBriefing,
  useRefreshBriefing,
  type BriefingStory,
} from '@workspace/api-client-react';
import { EmptyState, Eyebrow, formatNewsCategory } from '../components/SignalUI';

function relativeTime(value: Date | string | null): string {
  if (!value) return 'time unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'time unavailable'
    : formatDistanceToNowStrict(date, { addSuffix: true });
}

function StorySources({ story }: { story: BriefingStory }) {
  return (
    <div className="mt-3">
      <p className="mb-1 text-[9px] font-semibold uppercase tracking-[.12em] text-muted-foreground">
        Sources
      </p>
      <div className="flex flex-wrap items-center gap-x-1 text-[11px]">
        {story.sources.map((source, index) => (
          <span key={source.id}>
            {index > 0 ? <span className="mr-1 text-border">·</span> : null}
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              title={source.title}
              className="text-muted-foreground underline decoration-border underline-offset-2 hover:text-primary"
            >
              {source.source}
            </a>
          </span>
        ))}
      </div>
    </div>
  );
}

function StoryRow({
  story,
  index,
  compact = false,
}: {
  story: BriefingStory;
  index: number;
  compact?: boolean;
}) {
  return (
    <article
      className={`grid grid-cols-[28px_minmax(0,1fr)] gap-3 border-b border-border ${compact ? 'py-5' : 'py-7 sm:grid-cols-[42px_minmax(0,1fr)] sm:gap-5'}`}
      data-testid={`briefing-story-${story.id}`}
    >
      <span className={`serif pt-0.5 text-muted-foreground/55 ${compact ? 'text-[17px]' : 'text-[20px]'}`}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[9px] font-semibold uppercase tracking-[.1em] text-primary">
          <span>{formatNewsCategory(story.category)}</span>
          {story.firstPublishedAt ? (
            <>
              <span className="text-border">/</span>
              <time dateTime={new Date(story.firstPublishedAt).toISOString()}>
                First published {relativeTime(story.firstPublishedAt)}
              </time>
            </>
          ) : null}
        </div>
        <h3 className={`serif leading-[1.16] ${compact ? 'text-[19px]' : 'max-w-[760px] text-[24px] sm:text-[27px]'}`}>
          {story.title}
        </h3>
        <p className={`mt-3 max-w-[780px] text-[12px] leading-[1.75] text-foreground/80 ${compact ? 'line-clamp-3' : ''}`}>
          {story.summary}
        </p>
        <div className={`mt-4 border-l-2 border-[#b9a77b] pl-3 ${compact ? 'py-0.5' : 'py-1'}`}>
          <p className="text-[9px] font-semibold uppercase tracking-[.12em] text-muted-foreground">
            Why it matters
          </p>
          <p className={`mt-1 text-[11px] leading-[1.65] text-muted-foreground ${compact ? 'line-clamp-2' : 'max-w-[720px]'}`}>
            {story.whyItMatters}
          </p>
        </div>
        <StorySources story={story} />
        <p className="mt-3 text-[9px] text-muted-foreground">
          {story.sourceCount} {story.sourceCount === 1 ? 'source' : 'sources'}
          {' · '}Updated {relativeTime(story.updatedAt)}
        </p>
      </div>
    </article>
  );
}

export function BriefingPage() {
  const queryClient = useQueryClient();
  const briefingQuery = useGetBriefing({
    query: {
      queryKey: getGetBriefingQueryKey(),
      staleTime: Infinity,
      retry: false,
    },
  });
  const refreshMutation = useRefreshBriefing();
  const [refreshStatus, setRefreshStatus] = useState<'updated' | 'error' | null>(null);
  const briefing = briefingQuery.data;

  const refreshBriefing = async () => {
    setRefreshStatus(null);
    try {
      const updated = await refreshMutation.mutateAsync();
      queryClient.setQueryData(getGetBriefingQueryKey(), updated);
      setRefreshStatus('updated');
    } catch {
      setRefreshStatus('error');
    }
  };

  return (
    <>
      <header className="mb-7 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Eyebrow>Your briefing</Eyebrow>
          <h1 className="serif mt-2 text-[37px] leading-[1.08] md:text-[44px]" data-testid="heading-your-briefing">
            Catch up on what matters.
          </h1>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2">
          {refreshStatus === 'updated' ? (
            <span className="text-[10px] text-muted-foreground" role="status">
              Updated just now
            </span>
          ) : null}
          {refreshStatus === 'error' ? (
            <span className="max-w-[230px] text-[10px] leading-4 text-muted-foreground" role="alert">
              Could not refresh the briefing. Your previous briefing is unchanged.
            </span>
          ) : null}
          <button
            type="button"
            onClick={refreshBriefing}
            disabled={refreshMutation.isPending}
            className="inline-flex min-h-9 min-w-[145px] items-center justify-center gap-2 border border-border px-3 py-2 text-[11px] text-muted-foreground hover:border-primary hover:text-foreground disabled:cursor-wait disabled:opacity-60"
            data-testid="button-refresh-briefing"
          >
            <RefreshCw size={13} className={refreshMutation.isPending ? 'animate-spin' : ''} />
            {refreshMutation.isPending ? 'Refreshing briefing' : 'Refresh briefing'}
          </button>
        </div>
      </header>

      <p className="mb-8 max-w-[700px] text-[11px] leading-5 text-muted-foreground">
        Signal’s briefing is generated from the sources you’ve selected. It is a guide to coverage, not a guarantee of everything happening.
      </p>

      {briefingQuery.isError && !briefing ? (
        <p className="mb-5 text-[11px] text-muted-foreground" role="alert">
          The saved briefing could not be loaded. You can try refreshing to generate a new one.
        </p>
      ) : null}

      {briefingQuery.isLoading ? (
        <div className="animate-pulse border-t border-border" aria-label="Loading briefing">
          {[0, 1, 2].map((item) => (
            <div key={item} className="border-b border-border py-7">
              <div className="h-3 w-24 bg-muted/70" />
              <div className="mt-4 h-7 w-3/4 bg-muted/70" />
              <div className="mt-4 h-3 w-full max-w-[680px] bg-muted/70" />
            </div>
          ))}
        </div>
      ) : null}

      {!briefingQuery.isLoading && briefing?.topStories.length ? (
        <>
          <section aria-labelledby="heading-top-stories">
            <div className="mb-1 flex items-baseline justify-between border-b border-border pb-3">
              <h2 id="heading-top-stories" className="text-[11px] font-semibold uppercase tracking-[.14em]">
                Top stories
              </h2>
              {briefing.generatedAt ? (
                <span className="text-[10px] text-muted-foreground">
                  Signal’s briefing · Updated {relativeTime(briefing.generatedAt)}
                </span>
              ) : null}
            </div>
            {briefing.topStories.map((story, index) => (
              <StoryRow key={story.id} story={story} index={index} />
            ))}
          </section>

          {briefing.alsoHappening.length ? (
            <section className="mt-11" aria-labelledby="heading-also-happening">
              <div className="mb-1 border-b border-border pb-3">
                <h2 id="heading-also-happening" className="text-[11px] font-semibold uppercase tracking-[.14em]">
                  Also happening
                </h2>
              </div>
              {briefing.alsoHappening.map((story, index) => (
                <StoryRow key={story.id} story={story} index={index + briefing.topStories.length} compact />
              ))}
            </section>
          ) : null}
        </>
      ) : null}

      {!briefingQuery.isLoading && !briefingQuery.isError && !briefing?.topStories.length ? (
        <EmptyState
          title="Your briefing is ready when you are"
          text="Refresh to fetch the latest RSS coverage, group related reports, and prepare a source-linked briefing."
        />
      ) : null}
    </>
  );
}