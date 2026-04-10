// Implements a lightweight fetch-based HTTP client with timeout and retry support.
import iconv from 'iconv-lite';

import { logger, Logger } from '../logger/logger';
import { CookieJar } from './cookie-jar';
import { HttpClient, HttpRequest, HttpResponse } from './http-client';

export type FetchHttpClientOptions = {
  baseUrl: string;
  timeoutMs: number;
  maxRetries: number;
  maxRedirects?: number;
  defaultHeaders?: Record<string, string>;
  logger?: Logger;
};

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);
const HTML_META_CHARSET_REGEX =
  /<meta[^>]+charset\s*=\s*["']?\s*([a-zA-Z0-9._-]+)\s*["']?[^>]*>/i;
const HTML_META_CONTENT_TYPE_REGEX =
  /<meta[^>]+content\s*=\s*["'][^"']*charset\s*=\s*([a-zA-Z0-9._-]+)[^"']*["'][^>]*>/i;

export class FetchHttpClient implements HttpClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly maxRedirects: number;
  private readonly defaultHeaders: Record<string, string>;
  private readonly logger: Logger;

  constructor(options: FetchHttpClientOptions) {
    this.baseUrl = options.baseUrl;
    this.timeoutMs = options.timeoutMs;
    this.maxRetries = options.maxRetries;
    this.maxRedirects = options.maxRedirects ?? 5;
    this.defaultHeaders = options.defaultHeaders ?? {};
    this.logger = options.logger ?? logger;
  }

  async request<TBody>(request: HttpRequest): Promise<HttpResponse<TBody>> {
    const url = this.resolveUrl(request.pathOrUrl);
    const timeoutMs = request.timeoutMs ?? this.timeoutMs;
    const headers = {
      ...this.defaultHeaders,
      ...request.headers,
    };
    const maxRedirects = request.maxRedirects ?? this.maxRedirects;

    let attempt = 0;

    while (attempt <= this.maxRetries) {
      const startedAt = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const cookieJar = new CookieJar();

      try {
        this.logger.info('Outgoing HTTP request', {
          method: request.method,
          url,
          attempt: attempt + 1,
          timeoutMs,
        });

        const response = await this.fetchWithRedirects<TBody>({
          method: request.method,
          url,
          headers,
          body: request.body,
          signal: controller.signal,
          cookieJar,
          redirectsRemaining: maxRedirects,
        });

        clearTimeout(timeout);

        if (this.shouldRetry(response.statusCode) && attempt < this.maxRetries) {
          this.logger.info('Retrying HTTP request after retryable response', {
            method: request.method,
            url,
            attempt: attempt + 1,
            statusCode: response.statusCode,
          });

          attempt += 1;
          continue;
        }

        this.logger.info('HTTP request completed', {
          method: request.method,
          url: response.url,
          statusCode: response.statusCode,
          durationMs: response.durationMs,
        });

        return response;
      } catch (error) {
        clearTimeout(timeout);

        const durationMs = Date.now() - startedAt;
        const errorMessage = error instanceof Error ? error.message : 'Unknown HTTP error';

        this.logger.error('HTTP request failed', {
          method: request.method,
          url,
          attempt: attempt + 1,
          durationMs,
          error: errorMessage,
        });

        if (attempt >= this.maxRetries || !this.isRetryableError(error)) {
          throw error;
        }

        attempt += 1;
      }
    }

    throw new Error(`HTTP request exhausted retries: ${url}`);
  }

  private resolveUrl(pathOrUrl: string): string {
    return new URL(pathOrUrl, this.baseUrl).toString();
  }

  private async fetchWithRedirects<TBody>(options: {
    method: HttpRequest['method'];
    url: string;
    headers: Record<string, string>;
    body?: unknown;
    signal: AbortSignal;
    cookieJar: CookieJar;
    redirectsRemaining: number;
  }): Promise<HttpResponse<TBody>> {
    const startedAt = Date.now();
    const response = await fetch(options.url, {
      method: options.method,
      headers: options.cookieJar.apply(options.headers),
      body: this.serializeBody(options.body),
      signal: options.signal,
      redirect: 'manual',
    });

    const setCookieHeaders = this.getSetCookieHeaders(response.headers);

    if (setCookieHeaders.length > 0) {
      options.cookieJar.store(setCookieHeaders);
    }

    if (this.isRedirect(response.status) && options.redirectsRemaining > 0) {
      const location = response.headers.get('location');

      if (!location) {
        throw new Error(`Redirect response without location header: ${options.url}`);
      }

      const nextUrl = new URL(location, options.url).toString();

      this.logger.info('Following HTTP redirect', {
        from: options.url,
        to: nextUrl,
        statusCode: response.status,
        redirectsRemaining: options.redirectsRemaining,
      });

      return this.fetchWithRedirects<TBody>({
        ...options,
        url: nextUrl,
        method: this.resolveRedirectMethod(response.status, options.method),
        body: this.resolveRedirectBody(response.status, options.method, options.body),
        redirectsRemaining: options.redirectsRemaining - 1,
      });
    }

    const rawBody = Buffer.from(await response.arrayBuffer());
    const headers = this.mapHeaders(response.headers, setCookieHeaders);
    const charset = this.resolveResponseCharset(headers, rawBody);
    const body = this.decodeBody(rawBody, charset) as TBody;

    this.logger.info('Decoded HTTP response body', {
      url: options.url,
      statusCode: response.status,
      charset,
    });

    return {
      url: options.url,
      statusCode: response.status,
      body,
      headers,
      durationMs: Date.now() - startedAt,
    };
  }

  private serializeBody(body: unknown): BodyInit | undefined {
    if (body == null) {
      return undefined;
    }

    if (typeof body === 'string') {
      return body;
    }

    return JSON.stringify(body);
  }

  private shouldRetry(statusCode: number): boolean {
    return RETRYABLE_STATUS_CODES.has(statusCode);
  }

  private isRedirect(statusCode: number): boolean {
    return REDIRECT_STATUS_CODES.has(statusCode);
  }

  private isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    return error.name === 'AbortError' || error.name === 'TypeError';
  }

  private mapHeaders(
    headers: Headers,
    setCookieHeaders: string[],
  ): Record<string, string | string[] | undefined> {
    const result: Record<string, string | string[] | undefined> = {};

    headers.forEach((value, key) => {
      result[key] = value;
    });

    if (setCookieHeaders.length > 0) {
      result['set-cookie'] = setCookieHeaders;
    }

    return result;
  }

  private getSetCookieHeaders(headers: Headers): string[] {
    const nodeHeaders = headers as Headers & {
      getSetCookie?: () => string[];
    };

    if (typeof nodeHeaders.getSetCookie === 'function') {
      return nodeHeaders.getSetCookie();
    }

    const rawSetCookie = headers.get('set-cookie');

    return rawSetCookie ? [rawSetCookie] : [];
  }

  private resolveResponseCharset(
    headers: Record<string, string | string[] | undefined>,
    rawBody: Buffer,
  ): string {
    const headerCharset = this.extractCharsetFromContentType(headers['content-type']);

    if (headerCharset) {
      return headerCharset;
    }

    const metaCharset = this.extractCharsetFromHtmlMeta(rawBody);

    if (metaCharset) {
      return metaCharset;
    }

    return 'utf-8';
  }

  private extractCharsetFromContentType(header: string | string[] | undefined): string | null {
    const value = Array.isArray(header) ? header[0] : header;

    if (!value) {
      return null;
    }

    const match = value.match(/charset\s*=\s*([^;]+)/i);

    return this.normalizeCharset(match?.[1] ?? null);
  }

  private extractCharsetFromHtmlMeta(rawBody: Buffer): string | null {
    const headSnippet = rawBody.subarray(0, 4096).toString('latin1');
    const directCharsetMatch = headSnippet.match(HTML_META_CHARSET_REGEX);

    if (directCharsetMatch?.[1]) {
      return this.normalizeCharset(directCharsetMatch[1]);
    }

    const contentTypeMatch = headSnippet.match(HTML_META_CONTENT_TYPE_REGEX);

    return this.normalizeCharset(contentTypeMatch?.[1] ?? null);
  }

  private normalizeCharset(charset: string | null): string | null {
    if (!charset) {
      return null;
    }

    const normalized = charset.trim().replace(/^["']|["']$/g, '').toLowerCase();

    switch (normalized) {
      case 'utf8':
        return 'utf-8';
      case 'latin1':
      case 'latin-1':
      case 'iso8859-1':
        return 'iso-8859-1';
      case 'iso8859-15':
        return 'iso-8859-15';
      case 'cp1252':
        return 'windows-1252';
      default:
        return normalized;
    }
  }

  private decodeBody(rawBody: Buffer, charset: string): string {
    if (iconv.encodingExists(charset)) {
      return iconv.decode(rawBody, charset);
    }

    this.logger.info('Unsupported response charset, falling back to utf-8', { charset });

    return rawBody.toString('utf8');
  }

  private resolveRedirectMethod(statusCode: number, method: HttpRequest['method']): HttpRequest['method'] {
    if (statusCode === 303) {
      return 'GET';
    }

    return method;
  }

  private resolveRedirectBody(
    statusCode: number,
    method: HttpRequest['method'],
    body: unknown,
  ): unknown {
    if (statusCode === 303 && method !== 'GET') {
      return undefined;
    }

    return body;
  }
}
