import { useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Bookmark, BookmarkCheck, ChevronLeft, ExternalLink, RefreshCw } from 'lucide-react';
import {
  getGetNewsQueryKey,
  getNews,
  useGetNews,
  useGetNewsById,
} from '@workspace/api-client-react';
import {
  CoverageBar,
  EmptyState,
  Eyebrow,
  formatNewsCategory,
  formatPublishedTime,
  NewsLoadingRows,
  NewsRow,
  PageHeading,
} from '../components/SignalUI';

const categories = [
  { slug: 'international', label: 'International' },
  { slug: 'india', label: 'India' },
  { slug: 'united-states', label: 'United States' },
  { slug: 'technology', label: 'Technology' },
] as const;

type NewsActions = {
  saved: string[];
  toggle: (id: string) => void;
};

export function NewsPage({ saved, toggle }: NewsActions) {
  const params = useParams<{ category?: string }>();
  const selectedCategory = categories.find((item) => item.slug === params.category);
  const tabs = [{ slug: '', label: 'All' }, ...categories];
  const newsParams = selectedCategory ? { category: selectedCategory.slug } : undefined;
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useGetNews(newsParams);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<'updated' | 'error' | null>(null);
  const articles = data?.articles ?? [];

  const refreshNews = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    setRefreshStatus(null);
    try {
      const refreshedData = await getNews(newsParams, {
        headers: { 'cache-control': 'no-cache' },
      });
      queryClient.setQueryData(getGetNewsQueryKey(newsParams), refreshedData);
      setRefreshStatus('updated');
    } catch {
      setRefreshStatus('error');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <PageHeading
        eyebrow="The wider picture"
        title="News"
        description="Read reports from public news feeds, with each article linked to its publisher."
      />
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="News categories">
          {tabs.map((tab) => {
            const active = (selectedCategory?.label ?? 'All') === tab.label;
            return (
              <Link
                key={tab.label}
                href={tab.slug ? `/news/category/${tab.slug}` : '/news'}
                role="tab"
                aria-selected={active}
                className={`rounded-[2px] border px-3 py-1.5 text-[11px] ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
                data-testid={`filter-news-${tab.label.toLowerCase().replaceAll(' ', '-')}`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        <div className="flex min-h-8 items-center gap-2">
          {refreshStatus === 'updated' ? (
            <span className="text-[10px] text-muted-foreground" role="status">
              Updated just now
            </span>
          ) : null}
          {refreshStatus === 'error' ? (
            <span className="text-[10px] text-muted-foreground" role="alert">
              Refresh failed. Current articles are unchanged.
            </span>
          ) : null}
          <button
            type="button"
            onClick={refreshNews}
            disabled={isRefreshing}
            className="inline-flex min-w-[104px] items-center justify-center gap-1.5 border border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:border-primary hover:text-foreground disabled:cursor-wait disabled:opacity-60"
            aria-label="Refresh news"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing' : 'Refresh'}
          </button>
        </div>
      </div>

      {data?.failedSourceCount ? (
        <p
          className="mb-4 border-l-2 border-[#b9a77b] pl-3 text-[10px] leading-5 text-muted-foreground"
          role="status"
          data-testid="status-news-partial"
        >
          Some news feeds could not update. Articles from available sources are still shown.
        </p>
      ) : null}

      <div className="mb-3 flex items-center justify-between border-t border-border pt-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[.14em]">Top stories</h2>
        <span className="text-[10px] text-muted-foreground" data-testid="text-news-count">
          {isLoading ? 'Loading' : `${articles.length} articles`}
        </span>
      </div>

      {isLoading ? <NewsLoadingRows /> : null}
      {isError ? (
        <EmptyState
          title="News could not load"
          text="The news service is temporarily unavailable. Please try again shortly."
        />
      ) : null}
      {!isLoading && !isError && articles.length > 0 ? (
        <div>
          {articles.map((article, index) => (
            <NewsRow
              key={article.id}
              article={article}
              index={index}
              saved={saved.includes(article.id)}
              toggle={() => toggle(article.id)}
            />
          ))}
        </div>
      ) : null}
      {!isLoading && !isError && articles.length === 0 ? (
        <EmptyState
          title={data?.failedSourceCount ? 'News sources are temporarily unavailable' : 'No articles in this section'}
          text={
            data?.failedSourceCount
              ? 'Try again later; Signal will continue showing stories from any source that is available.'
              : 'There are no recent articles in this category. Try another section.'
          }
        />
      ) : null}
    </>
  );
}

export function StoryPage({ saved, toggle }: NewsActions) {
  const params = useParams<{ storyId: string }>();
  const [, setLocation] = useLocation();
  const { data: article, isLoading, isError } = useGetNewsById(params.storyId);

  if (isLoading) {
    return (
      <>
        <button
          onClick={() => setLocation('/news')}
          className="mb-7 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary"
          data-testid="button-back-news"
        >
          <ChevronLeft size={14} />
          Back to stories
        </button>
        <NewsLoadingRows count={2} />
      </>
    );
  }

  if (isError || !article) {
    return (
      <EmptyState
        title="Article not found"
        text="This article may have left its publisher’s recent feed."
        action={<Link href="/news" className="text-primary">Back to news</Link>}
      />
    );
  }

  return (
    <>
      <button
        onClick={() => setLocation('/news')}
        className="mb-7 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary"
        data-testid="button-back-news"
      >
        <ChevronLeft size={14} />
        Back to stories
      </button>
      <article className="mx-auto max-w-[930px]">
        <div className="flex items-center justify-between gap-4">
          <Eyebrow>
            {formatNewsCategory(article.category)} · {article.source} · {formatPublishedTime(article.publishedAt)}
          </Eyebrow>
          <button
            type="button"
            onClick={() => toggle(article.id)}
            className="flex shrink-0 items-center gap-2 border border-border px-3 py-2 text-[11px] hover:border-primary"
            data-testid="button-save-story-detail"
          >
            {saved.includes(article.id) ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            {saved.includes(article.id) ? 'Saved' : 'Save story'}
          </button>
        </div>
        <h1 className="serif mt-5 max-w-[800px] text-[38px] leading-[1.06] md:text-[54px]" data-testid="heading-story">
          {article.title}
        </h1>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground" data-testid="text-story-reading-meta">
          <a href={article.sourceUrl} target="_blank" rel="noreferrer" className="hover:text-primary">
            {article.source}
          </a>
          <span>·</span>
          <time dateTime={article.publishedAt ?? undefined}>{formatPublishedTime(article.publishedAt)}</time>
          <span>·</span>
          <span>{formatNewsCategory(article.category)}</span>
        </div>

        <div className="mt-8 grid gap-9 border-y border-border py-7 md:grid-cols-[minmax(0,1fr)_240px]">
          <div>
            <p className="serif text-[21px] leading-[1.48] text-foreground/85" data-testid="text-story-summary">
              {article.description || 'The publisher has not provided a summary for this article.'}
            </p>
          </div>
          <aside className="border-l border-border pl-5">
            <Eyebrow>One report</Eyebrow>
            <p className="mt-3 text-[12px] leading-[1.75] text-muted-foreground">
              This page shows one article from {article.source}. It is not a complete account or a comparison of other coverage.
            </p>
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline"
              data-testid="link-original-article"
            >
              Read original article <ExternalLink size={12} />
            </a>
          </aside>
        </div>

        {article.coverage && article.coverage.total > 0 ? (
          <section className="mb-5 mt-8">
            <Eyebrow>Coverage data</Eyebrow>
            <h2 className="serif mt-2 text-[27px]" data-testid="heading-coverage">
              How this story is being covered
            </h2>
            <div className="mt-4 max-w-[560px]">
              <CoverageBar article={article} size="large" />
            </div>
          </section>
        ) : null}
      </article>
    </>
  );
}