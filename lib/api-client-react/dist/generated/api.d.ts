import type { QueryKey, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { ApiError, GetNewsParams, HealthStatus, NewsArticle, NewsListResponse } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: Parameters<typeof customFetch>[1]) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetNewsUrl: (params?: GetNewsParams) => string;
/**
 * Fetches configured RSS feeds and returns available normalized articles.
 * @summary List normalized news articles
 */
export declare const getNews: (params?: GetNewsParams, options?: Parameters<typeof customFetch>[1]) => Promise<NewsListResponse>;
export declare const getGetNewsQueryKey: (params?: GetNewsParams) => readonly ["/api/news", ...GetNewsParams[]];
export declare const getGetNewsQueryOptions: <TData = Awaited<ReturnType<typeof getNews>>, TError = ErrorType<ApiError>>(params?: GetNewsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getNews>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getNews>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetNewsQueryResult = NonNullable<Awaited<ReturnType<typeof getNews>>>;
export type GetNewsQueryError = ErrorType<ApiError>;
/**
 * @summary List normalized news articles
 */
export declare function useGetNews<TData = Awaited<ReturnType<typeof getNews>>, TError = ErrorType<ApiError>>(params?: GetNewsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getNews>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetNewsByIdUrl: (id: string) => string;
/**
 * @summary Get a normalized news article
 */
export declare const getNewsById: (id: string, options?: Parameters<typeof customFetch>[1]) => Promise<NewsArticle>;
export declare const getGetNewsByIdQueryKey: (id: string) => readonly [`/api/news/${string}`];
export declare const getGetNewsByIdQueryOptions: <TData = Awaited<ReturnType<typeof getNewsById>>, TError = ErrorType<ApiError>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getNewsById>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getNewsById>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetNewsByIdQueryResult = NonNullable<Awaited<ReturnType<typeof getNewsById>>>;
export type GetNewsByIdQueryError = ErrorType<ApiError>;
/**
 * @summary Get a normalized news article
 */
export declare function useGetNewsById<TData = Awaited<ReturnType<typeof getNewsById>>, TError = ErrorType<ApiError>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getNewsById>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map