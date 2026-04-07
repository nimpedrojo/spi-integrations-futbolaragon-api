// Defines the minimal HTTP abstraction to isolate transport details from source clients.
export type HttpRequest = {
  method: 'GET' | 'POST';
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
};

export type HttpResponse<TBody> = {
  statusCode: number;
  body: TBody;
};

export interface HttpClient {
  request<TBody>(request: HttpRequest): Promise<HttpResponse<TBody>>;
}
