import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NotifyTemplateService {
  mockTemplates: any = [
    {
      template_id: 1,
      template: `
      <a class="dropdown-item" href="#">
        <div style="font-size: 14px; white-space: normal;">
          <span style="font-weight: 600; white-space: normal; word-wrap: break-word; word-break: break-word; width: 100%;">{{subject_id}}</span>
          
            <span>ส่งทั้งหมด {{total}} รายการ</span>
            <span class="text-success">สำเร็จ {{success}} รายการ</span>
            <span class="text-danger">ไม่สำเร็จ {{fail}} รายการ</span>
          
        </div>
        <div style="font-size: 12px; color: grey">{{calculatedTime}}</div>
        </a>
      `,
      description: 'Template for sending summary notification',
    },
  ];

  private templates = this.mockTemplates; // ใช้ mockTemplates แทนฐานข้อมูล

  constructor() {}

  getTemplateById(template_id: number): string | null {
    const template = this.templates.find(
      (t: any) => t.template_id === template_id
    );
    return template ? template.template : null;
  }

  replacePlaceholders(template: string, params: any): string {
    return template.replace(/{{(.*?)}}/g, (_, key) => params[key.trim()] || '');
  }
  // private templates: { [key: number]: string } = {};

  // constructor(private http: HttpClient) {}

  // loadTemplates(): void {
  //   this.http
  //     .get<{ template_id: number; template: string }[]>('/api/templates')
  //     .subscribe((templates) => {
  //       templates.forEach((t) => {
  //         this.templates[t.template_id] = t.template;
  //       });
  //     });
  // }

  // getTemplate(templateId: number): string | undefined {
  //   return this.templates[templateId];
  // }
}
