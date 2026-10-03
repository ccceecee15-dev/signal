import { Link } from 'wouter';
import { useGetNews } from '@workspace/api-client-react';
import { ChevronRight, Clock3 } from 'lucide-react';
import { videos } from '../data/mock';
import { EmptyState, Eyebrow, NewsLoadingRows, NewsRow, VideoCompact } from '../components/SignalUI';

type HomeProps = {
  savedStories: string[];
  toggleStory: (id: string) => void;
  watched: string[];
  toggleWatched: (id: string) => void;
  savedVideos: string[];
  toggleVideo: (id: string) => void;
};

export function HomePage({
  savedStories,
  toggleStory,
  watched,
  toggleWatched,
  savedVideos,
  toggleVideo,
}: HomeProps) {
  const { data, isLoading, isError } = useGetNews();
  const articles = data?.articles ?? [];
  const briefing = articles.slice(0, 4);
  const recentVideos = videos.slice(0, 4);

  return (
    <>
      <div className="mb-10 flex items-end justify-between border-b border-border pb-8">
        <div>
          <Eyebrow>Your briefing · public RSS news</Eyebrow>
          <h1 className="serif mt-3 text-[44px] leading-[1.03] md:text-[56px]" data-testid="heading-briefing">
            Good evening.
          </h1>
          <p className="mt-4 max-w-[450px] text-[13px] leading-6 text-muted-foreground">
            Here’s what is worth your attention today.
          </p>
        </div>
        <div className="hidden text-right sm:block">
          <div className="serif text-[38px] text-foreground/80">
            {isLoading ? '··' : String(briefing.length).padStart(2, '0')}
          </div>
          <div className="text-[10px] uppercase tracking-[.13em] text-muted-foreground">stories to start</div>
        </div>
      </div>

      <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_310px]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-[.14em]">Your briefing</h2>
            <span className="text-[11px] text-muted-foreground">Latest from configured feeds</span>
          </div>
          <div className="border-t border-border">
            {isLoading ? <NewsLoadingRows count={4} /> : null}
            {isError ? (
              <EmptyState
                title="News could not load"
                text="The news service is temporarily unavailable. Please try again shortly."
              />
            ) : null}
            {!isLoading && !isError && briefing.length > 0
              ? briefing.map((article, index) => (
                  <NewsRow
                    key={article.id}
                    article={article}
                    saved={savedStories.includes(article.id)}
                    toggle={() => toggleStory(article.id)}
                    index={index}
                  />
                ))
              : null}
            {!isLoading && !isError && briefing.length === 0 ? (
              <EmptyState
                title={data?.failedSourceCount ? 'News sources are temporarily unavailable' : 'No recent news'}
                text="Signal will show articles here as soon as its configured feeds return recent stories."
              />
            ) : null}
          </div>
          {data?.failedSourceCount ? (
            <p className="mt-3 text-[10px] leading-5 text-muted-foreground" role="status" data-testid="status-home-partial">
              Some news feeds could not update; available articles are still shown.
            </p>
          ) : null}
          <Link href="/news" className="mt-5 inline-flex items-center gap-2 text-[12px] font-medium text-primary hover:underline" data-testid="link-all-news">
            Explore all stories <ChevronRight size={14} />
          </Link>
        </div>

        <aside className="border-t border-border pt-4 lg:border-t-0 lg:border-l lg:pl-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-[.14em]">From your channels</h2>
            <Link href="/videos" className="text-[11px] text-primary" data-testid="link-videos">All</Link>
          </div>
          <div className="space-y-0">
            {recentVideos.map((video) => (
              <VideoCompact
                key={video.id}
                video={video}
                saved={savedVideos.includes(video.id)}
                toggleSave={() => toggleVideo(video.id)}
                watched={watched.includes(video.id)}
                toggleWatched={() => toggleWatched(video.id)}
              />
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground">
            <Clock3 size={14} /> About 45 minutes of sample viewing
          </div>
        </aside>
      </section>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-[11px] text-muted-foreground">
        <span>News headlines and summaries come from public RSS feeds; videos remain demo content.</span>
        <Link href="/settings" className="inline-flex items-center gap-1 text-primary" data-testid="link-preferences">
          Tune your briefing <ChevronRight size={13} />
        </Link>
      </div>
    </>
  );
}