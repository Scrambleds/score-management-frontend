import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  private hubConnection!: signalR.HubConnection;
  apiHost: string = environment.apiUrl;
  notifyHub: string = `${this.apiHost}/notifyHub`;
  progressHub: string = `${this.apiHost}/progressHub`;
  private progressConnection!: signalR.HubConnection;

  constructor() {}

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

  onNotification(callback: (data: any) => void) {
    // รับข้อมูลจาก SignalR
    this.hubConnection.on('ReceiveNotification', (notificationJson: any) => {
      try {
        const notification = JSON.parse(notificationJson);
        console.log('Received Notification:', notificationJson);
        callback(notification);
        // ทำงานเพิ่มเติมกับ notification ได้ที่นี่
      } catch (error) {
        console.error('Failed to parse notification:', error);
      }
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

  //progress
  private progressSubject = new BehaviorSubject<{
    successCount: number;
    failCount: number;
  }>({ successCount: 0, failCount: 0 });
  progress$ = this.progressSubject.asObservable();

  startProgressConnection() {
    this.progressConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.progressHub)
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.progressConnection.on('ReceiveProgress', (completed, failed) => {
      console.log(`Received Update => Success: ${completed}, Fail: ${failed}`);

      // อัปเดตค่าให้ BehaviorSubject
      this.progressSubject.next({ successCount: completed, failCount: failed });
    });

    try {
      this.progressConnection.start();
      console.log('Connected to SignalR');
    } catch (err) {
      console.error('Error connecting to SignalR: ', err);
    }
  }

  // ฟังก์ชันสำหรับปิดการเชื่อมต่อ
  stopProgressConnection() {
    if (this.progressConnection) {
      this.progressConnection.stop();
      console.log('Disconnected from SignalR');
    }
  }
}
