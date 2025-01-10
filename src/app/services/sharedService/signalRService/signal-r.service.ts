import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../../environments/environment';
import { NotifyTemplateService } from '../../notify-template/notify-template.service';
interface Notification {
  template_id: number;
  subject_id: string;
  total: number;
  success: number;
  fail: number;
  create_date: string;
  calculatedTime?: string; // เพิ่ม property
}

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  private hubConnection!: signalR.HubConnection;
  apiHost: string = environment.apiUrl;
  notifyHub: string = `${this.apiHost}/notifyHub`;
  // notifyHub: string = `${this.apiHost}/notifyHub`;

  constructor(private notifyTemplate: NotifyTemplateService) {}

  startConnection() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.notifyHub, {
        accessTokenFactory: () => {
          const token = localStorage.getItem('token');
          if (token) {
            return token; // คืนค่า token หากพบ
          }
          console.warn('No JWT token found in localStorage.');
          return ''; // คืนค่าว่างหากไม่มี token
        },
      })
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('SignalR Connected'))
      .catch((err) => console.error('SignalR Connection Error: ', err));
  }

  // onNotification(callback: (message: string) => void) {
  //   this.hubConnection.on('ReceiveNotification', (message: string) => {
  //     console.log('Notification received:', message); // ตรวจสอบข้อความที่ได้รับ
  //     callback(message);
  //   });
  //   // this.hubConnection.on('ReceiveNotification', callback);
  // }
  // onNotification(callback: (html: string) => void): void {
  //   this.hubConnection.on('ReceiveNotification', (data: any) => {
  //     const { template_id, ...params } = data;
  //     const template = this.notifyTemplate.getTemplate(template_id);

  //     if (template) {
  //       const html = this.replacePlaceholders(template, params);
  //       callback(html);
  //     } else {
  //       console.error(`Template with ID ${template_id} not found.`);
  //     }
  //   });
  // }
  onNotification(callback: (data: any) => void) {
    // Mock Notification Object
    const mockNotification: Notification[] = [
      {
        template_id: 1,
        subject_id: '01418222-60',
        total: 10,
        success: 8,
        fail: 2,
        // calculatedTime: '5 นาทีที่แล้ว',
        create_date: '2025-01-03 04:40:29.713',
      },
      {
        template_id: 1,
        subject_id: '01418223-61',
        total: 15,
        success: 12,
        fail: 3,
        // calculatedTime: '2 นาทีที่แล้ว',
        create_date: '2025-01-10 00:35:29.713',
      },
      {
        template_id: 1,
        subject_id: '01418223-62',
        total: 15,
        success: 12,
        fail: 3,
        // calculatedTime: '2 นาทีที่แล้ว',
        create_date: '2025-01-10 00:35:29.713',
      },
      {
        template_id: 1,
        subject_id: '01418223-63',
        total: 15,
        success: 12,
        fail: 3,
        // calculatedTime: '2 นาทีที่แล้ว',
        create_date: '2025-01-10 00:35:29.713',
      },
    ];

    // Simulate SignalR Notification
    // setTimeout(() => {
    //   callback(mockNotification);
    // }, 1000); // ส่งข้อมูล mock หลังจาก 1 วินาที
    mockNotification.forEach((notification, index) => {
      // จำลองการส่ง Notification ทีละรายการ
      notification.calculatedTime = this.calculateTime(
        notification.create_date
      );
      setTimeout(() => {
        callback(notification);
      }, 1000 * (index + 1)); // ส่งห่างกัน 1 วินาทีต่อรายการ
    });
  }

  sendNotification(message: string) {
    this.hubConnection
      .invoke('SendNotifyToAll', message)
      .catch((err) => console.error('Error sending notification: ', err));
  }

  // ฟังก์ชันส่งการแจ้งเตือน (ส่งข้อความไปยังผู้ใช้เฉพาะ)
  sendNotificationToUser(userName: string, message: string) {
    this.hubConnection
      .invoke('SendNotifyToUser', userName, message)
      .catch((err) => console.error('Error sending notification: ', err));
  }

  private replacePlaceholders(
    template: string,
    params: { [key: string]: any }
  ): string {
    return template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
      const trimmedKey = key.trim();
      return params[trimmedKey] !== undefined
        ? params[trimmedKey]
        : `{{${trimmedKey}}}`;
    });
  }

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
