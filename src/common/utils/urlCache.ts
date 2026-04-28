const BAD_URLS_KEY = 'syncio_bad_urls_v1';
const MAX_CACHE_SIZE = 1000;

class UrlCache {
  private badUrls: Set<string>;

  constructor() {
    this.badUrls = new Set();
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(BAD_URLS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.badUrls = new Set(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load bad URL cache', e);
    }
  }

  private saveToStorage() {
    try {
      // Keep only the most recent entries if we exceed the limit
      let array = Array.from(this.badUrls);
      if (array.length > MAX_CACHE_SIZE) {
        array = array.slice(array.length - MAX_CACHE_SIZE);
        this.badUrls = new Set(array);
      }
      localStorage.setItem(BAD_URLS_KEY, JSON.stringify(array));
    } catch (e) {
      console.error('Failed to save bad URL cache', e);
    }
  }

  private normalize(url: string): string {
    return url; 
  }

  /**
   * Checks if a URL is known to be invalid (404).
   */
  public isBad(url: string | undefined): boolean {
    if (!url) return false;
    // Don't mark GCS URLs as bad persistently, only per-session if needed
    if (url.includes('storage.googleapis.com')) return false;
    return this.badUrls.has(this.normalize(url));
  }

  /**
   * Marks a URL as invalid to prevent future requests.
   */
  public markBad(url: string | undefined) {
    if (!url) return;
    const normalized = this.normalize(url);
    if (!this.badUrls.has(normalized)) {
      this.badUrls.add(normalized);
      this.saveToStorage();
    }
  }

  /**
   * Clears the cache.
   */
  public clear() {
    this.badUrls.clear();
    localStorage.removeItem(BAD_URLS_KEY);
  }
}

export const urlCache = new UrlCache();
