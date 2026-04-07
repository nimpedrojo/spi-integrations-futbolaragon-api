// Defines the minimal HTTP abstraction to isolate transport details from source clients.
export type HttpRequest = {
  method: 'GET' | 'POST';
  pathOrUrl: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  maxRedirects?: number;
};

export type HttpResponse<TBody> = {
  url: string;
  statusCode: number;
  body: TBody;
  headers: Record<string, string | string[] | undefined>;
  durationMs: number;
};

export interface HttpClient {
  request<TBody>(request: HttpRequest): Promise<HttpResponse<TBody>>;
}
