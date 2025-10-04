import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CacheService {
  private responseCache = new Map();
  clearCacheForUrl(urlPart: string): void {
    console.log('URL part to clear cache:', urlPart);
    console.log('Before cache clear:', this.responseCache);

    // ค้นหา key ที่มี URL ตรงกับข้อความที่ระบุ
    const keysToDelete = Array.from(this.responseCache.keys()).filter((key) =>
      key.includes(urlPart)
    );

    // ลบ key เหล่านั้นออกจากแคช
    keysToDelete.forEach((key) => this.responseCache.delete(key));

    console.log('After cache clear:', this.responseCache);
  }

  clearAllCache(): void {
    this.responseCache.clear();
  }

  setCache(url: string, response: any): void {
    this.responseCache.set(url, response);
  }

  getCache(url: string): any {
    return this.responseCache.get(url);
  }
}
