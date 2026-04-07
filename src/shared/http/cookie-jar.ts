// Stores and applies basic cookies across sequential HTTP requests.
export class CookieJar {
  private readonly cookies = new Map<string, string>();

  apply(headers: Record<string, string>): Record<string, string> {
    const cookieHeader = this.toHeader();

    if (!cookieHeader) {
      return headers;
    }

    return {
      ...headers,
      cookie: cookieHeader,
    };
  }

  store(setCookieHeaders: string[]): void {
    for (const header of setCookieHeaders) {
      const [cookiePair] = header.split(';');

      if (!cookiePair) {
        continue;
      }

      const separatorIndex = cookiePair.indexOf('=');

      if (separatorIndex <= 0) {
        continue;
      }

      const name = cookiePair.slice(0, separatorIndex).trim();
      const value = cookiePair.slice(separatorIndex + 1).trim();

      if (!name) {
        continue;
      }

      this.cookies.set(name, value);
    }
  }

  private toHeader(): string {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }
}
