import { Component, signal, effect, OnInit } from '@angular/core';
import {
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
} from '@angular/router';
import { Spinkit } from 'ng-http-loader';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false,
})
export class AppComponent implements OnInit {
  public spinkit = Spinkit;
  public customSpinner = LoadingSpinnerComponent;
  ignoredUrls: string[] = [
    '/api/MasterData/Subject',
    '/api/StudentScore/SendStudentScore',
    '/api/StudentScore/UploadScore',
  ];

  searchCriteria: any = {};
  isOpen: boolean = false;
  isLoginPage: boolean = false;

  // สร้าง Signal สำหรับการโหลด
  isLoading = signal(false);

  constructor(private router: Router) {
    // effect เพื่อจัดการการแสดง/ซ่อน spinner

    effect(() => {
      const spinner = document.getElementById('loading-spinner');
      if (spinner) {
        // ใช้ค่าใน signal เพื่อตรวจสอบสถานะการโหลด
        if (this.isLoading()) {
          spinner.style.display = 'block'; // แสดง spinner
        } else {
          spinner.style.display = 'none'; // ซ่อน spinner
        }
      }
      this.router.events.subscribe(() => {
        // ตรวจสอบเส้นทางปัจจุบัน
        this.isLoginPage = this.router.url === '/Login';
      });
    });
  }

  ngOnInit(): void {
    this.isLoading.set(true); // เริ่มการโหลด
    setTimeout(() => {
      this.isLoading.set(false); // หยุดการโหลดหลังจาก 2 วินาที
    }, 600); // จำลองเวลาโหลด 2 วินาที
  }

  onSearch(criteria: any) {
    this.searchCriteria = criteria; // รับข้อมูลจาก EditUserComponent
  }

  toggleNav() {
    this.isOpen = !this.isOpen;
  }
}
