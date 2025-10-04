import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotifyTemplateService {
  private notifyTemplateUrl: string = `${environment.apiUrl}/api/MasterData/NotifyTemplate`;
  private getNotifyUrl: string = `${environment.apiUrl}/api/Notification/GetNotify`;

  private templates: any[] = [];

  constructor(private http: HttpClient) {}

  getNotifications(username: string): Observable<any[]> {
    const url = `${this.getNotifyUrl}/${username}`;
    return this.http.get<Record<string, string>>(url).pipe(
      map((response: any) => response.objectResponse),
      tap((_) => console.log('get notify success'))
    );
  }

  getTemplates(): Observable<any> {
    return this.http.get<Record<string, string>>(this.notifyTemplateUrl).pipe(
      map((response: any) => response.objectResponse),
      tap((data) => {
        this.templates = data;
      })
    );
  }

  getTemplateById(template_id: number): string | null {
    // debugger;
    const template = this.templates.find(
      (t: any) => t.template_id === template_id
    );
    return template ? template.html_content : null;
  }

  replacePlaceholders(template: string, params: any): string {
    return template.replace(/{{(.*?)}}/g, (_, key) => params[key.trim()] || '');
  }

  // ฟังก์ชันสำหรับคำนวณเวลาที่ผ่านมา
  calculateTime(createAt: string): string {
    const currentTime = new Date();
    const createTime = new Date(createAt);
    const diffMinutes = Math.floor(
      (currentTime.getTime() - createTime.getTime()) / 60000
    );
    if (diffMinutes < 1) {
      return `เมื่อสักครู่`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes} นาทีที่แล้ว`;
    } else if (diffMinutes < 1440) {
      const diffHours = Math.floor(diffMinutes / 60);
      return `${diffHours} ชั่วโมงที่แล้ว`;
    } else {
      const diffDays = Math.floor(diffMinutes / 1440);
      return `${diffDays} วันที่แล้ว`;
    }
  }
}
