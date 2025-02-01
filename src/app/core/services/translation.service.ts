import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private translations = new BehaviorSubject<Record<string, string>>({});
  private currentLang = 'th'; // ตั้งค่าภาษาเริ่มต้นเป็น 'th'

  constructor(private http: HttpClient) {
    this.setInitialLanguage(); // เรียกใช้เพื่อโหลดภาษาที่เก็บไว้
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private setInitialLanguage(): void {
    // ถ้าเป็นการเรียกใน browser และมีการเก็บภาษาใน localStorage
    if (this.isBrowser()) {
      const savedLang = localStorage.getItem('language');
      if (savedLang) {
        this.currentLang = savedLang;
      }
    }
    this.loadTranslations(this.currentLang);
  }

  loadTranslations(language: string): void {
    // เช็คว่าโค้ดนี้ทำงานใน browser หรือไม่
    if (typeof window !== 'undefined') {
      // ถ้าไม่มีคำแปลใน localStorage ให้ดึงจาก API
      this.http
        .get<Record<string, string>>(
          `${environment.apiUrl}/api/MasterData/Language?language=${language}`
        )
        .subscribe((data: any) => {
          const translations = data.objectResponse;
          this.currentLang = language;
          this.translations.next(translations);

          if (this.isBrowser()) {
            localStorage.setItem('language', language); // เก็บภาษาปัจจุบัน
          }
        });
      // }
    }
  }

  getTranslations(): Observable<Record<string, string>> {
    return this.translations.asObservable();
  }

  getTranslation(key: string, params?: Record<string, string>): string {
    let template = this.translations.getValue()[key] || key;
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        template = template.replace(`{${paramKey}}`, paramValue);
      }
    }
    return template;
  }

  // ฟังก์ชันเพื่อดึงค่าภาษา
  getCurrentLanguage(): string {
    return this.currentLang;
  }

  changeLanguage(lang: string): void {
    // เมื่อมีการเปลี่ยนภาษา จะโหลดคำแปลใหม่และเก็บไว้ใน localStorage
    this.loadTranslations(lang);
  }

  //for pipe translate
  transform(value: string, variables?: Record<string, string>): string {
    let translation = this.getTranslation(value) || value;

    if (variables) {
      Object.keys(variables).forEach((key) => {
        translation = translation.replace(`{${key}}`, variables[key]);
      });
    }
    return translation;
  }

  //for search Ng-select
  searchFn(
    term: string,
    item: any,
    fields: { th: string; en: string } = {
      th: 'byte_desc_th',
      en: 'byte_desc_en',
    }
  ): boolean {
    term = term.toLowerCase();
    const lang = this.getCurrentLanguage();
    const field = lang === 'th' ? fields['th'] : fields['en'];
    return item[field]?.toLowerCase().includes(term);
  }
}
