import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { TranslationService } from '../../core/services/translation.service';
import { UserService } from '../../services/sharedService/userService/userService.service';
import { SignalRService } from '../../services/sharedService/signalRService/signal-r.service';
import { NotifyTemplateService } from '../../services/notify-template/notify-template.service';

@Component({
  selector: 'app-top-nav',
  standalone: false,
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.css'],
})
export class TopNavComponent implements OnInit {
  currentLang = '';
  currentTitle: string = '';
  @Input() isOpen: boolean = false; // รับค่าจาก Parent
  @Output() toggle = new EventEmitter<void>(); // ส่ง Event กลับไปยัง Parent

  prefix: string = '';
  firstname: string = '';
  lastname: string = '';
  teacher_code: string = '';
  role: string = '';

  //notify
  notification: any = null;
  notifications: any[] = []; // Array สำหรับเก็บ Notifications

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private translationService: TranslationService,
    private UserService: UserService,
    private signalRService: SignalRService,
    private notifyTemplate: NotifyTemplateService
  ) {}

  ngOnInit(): void {
    console.log('My nav');
    this.UserService.userInfo$.subscribe((userInfo) => {
      if (userInfo) {
        this.prefix = userInfo.prefix_description_th;
        this.firstname = userInfo.firstname;
        this.lastname = userInfo.lastname;
        this.teacher_code = userInfo.teacher_code;
        this.role = userInfo.role_description_th;
      }
    });

    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem(`language`) || 'th';
      this.currentLang = savedLang;
    }

    // โหลดคำแปลของภาษาเริ่มต้นหรือภาษาที่เลือก
    this.translationService.loadTranslations(this.currentLang);
    //set title page
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route = this.activatedRoute;
          console.log(route);
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route.snapshot.data['messageKey'];
        })
      )
      .subscribe((key) => {
        this.currentTitle = key || 'No title'; // กำหนดค่าเริ่มต้นในกรณีที่ไม่มี messageKey
      });
    // เรียกใช้เมธอดนี้หลังจากที่ Angular ได้ทำการเรนเดอร์หน้าและเปลี่ยนเส้นทาง
    this.setInitialTitle();

    this.signalRService.onNotification((data: any) => {
      const template = this.notifyTemplate.getTemplateById(data.template_id);
      if (template) {
        const html = this.notifyTemplate.replacePlaceholders(template, data);

        const notificationList = document.getElementById('notificationList');
        if (notificationList) {
          // const div = document.createElement('div');
          const li = document.createElement('li');
          li.innerHTML = html;
          // ตรวจสอบว่ามีข้อความแจ้งเตือนอยู่ใน list แล้วหรือยัง
          const notifications = notificationList.querySelectorAll('li');

          // ถ้าผลลัพธ์ของ notifications มีมากกว่าหนึ่ง (มีข้อมูลแจ้งเตือนก่อนหน้านี้)
          if (notifications.length > 1) {
            console.log('true');
            // เพิ่ม divider ก่อนที่จะเพิ่ม <li> ใหม่
            const divider = document.createElement('li');
            divider.innerHTML = `<hr class="dropdown-divider" />`;
            notificationList.insertBefore(divider, notifications[1]); // แทรก divider หลังจาก <h6> header
            notificationList.insertBefore(li, divider); // แทรก notify ใหม่ก่อน divider ที่เพิ่งเพิ่ม
            // แทรก divider ก่อน <li> ที่มีอยู่แล้ว
          } else {
            notificationList.insertBefore(li, notifications[1]); // แทรกใหม่ก่อน <li> ตัวแรก
            console.log('false');
          }
        }
      } else {
        console.error('Template not found for ID:', data.template_id);
      }
    });
    //notify
    // this.notifyTemplate.loadTemplates(); // โหลดเทมเพลตเมื่อเริ่มต้น
    // this.signalRService.startConnection();

    // this.signalRService.onNotification((html: string) => {
    //   const notificationList = document.getElementById('notificationList');
    //   if (notificationList) {
    //     // const div = document.createElement('li');
    //     // div.innerHTML = html; // ใช้ HTML ที่แปลงแล้ว
    //     // notificationList.appendChild(div);
    //     const li = document.createElement('li');

    //     // กำหนดโครงสร้างภายในของ li
    //     li.innerHTML = `
    //   <a class="dropdown-item" href="#">
    //     <div style="font-size: 14px">
    //       <span style="font-weight: 600">${html.subject_id}</span>
    //       <span>
    //         ส่งทั้งหมด ${html.total} รายการ
    //         <span class="text-success">สำเร็จ ${html.success} รายการ</span>
    //         <span class="text-danger">ไม่สำเร็จ ${html.fail} รายการ</span>
    //       </span>
    //     </div>
    //     <div style="font-size: 12px; color: grey">${calculateTime(
    //       html.createAt
    //     )}</div>
    //   </a>
    // `;

    //     // เพิ่ม li ใหม่เข้าไปใน notificationList
    //     notificationList.appendChild(li);

    //     // เพิ่ม Divider (optional)
    //     const divider = document.createElement('li');
    //     divider.innerHTML = `<hr class="dropdown-divider" />`;
    //     notificationList.appendChild(divider);
    //   }
    // });
  }

  // Function สำหรับ Toggle Side Nav
  toggleNav() {
    this.toggle.emit(); // ส่ง Event กลับไปยัง Parent
  }

  //switch language
  changeLanguage(event: Event, lang: string): void {
    event.preventDefault(); // ป้องกันไม่ให้เกิดการ reload หน้า
    this.translationService.changeLanguage(lang); // ใช้ฟังก์ชันจาก TranslationService
    this.currentLang = lang; // อัปเดตภาษาปัจจุบัน
    localStorage.setItem('language', lang); // เก็บภาษาลงใน localStorage
  }

  // เพิ่มฟังก์ชั่นนี้เพื่ออัพเดต title เมื่อเข้าหน้าโดยตรง
  setInitialTitle(): void {
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }
    this.currentTitle = route.snapshot.data['messageKey'] || 'No title';
  }

  onLogout() {
    localStorage.clear(); // Clear token and expiration
    this.router.navigate(['/Login']); // Redirect to login page
  }

  //notify
  // Calculate elapsed time
  calculateElapsedTime(createAt: Date): number {
    const now = new Date();
    const elapsedMilliseconds = now.getTime() - new Date(createAt).getTime();
    return Math.floor(elapsedMilliseconds / 60000); // Convert to minutes
  }
  // ฟังก์ชันสำหรับคำนวณเวลาที่ผ่านมา
  calculateTime(createAt: string): string {
    const currentTime = new Date();
    const createTime = new Date(createAt);
    const diffMinutes = Math.floor(
      (currentTime.getTime() - createTime.getTime()) / 60000
    );

    if (diffMinutes < 60) {
      return `${diffMinutes} นาทีที่แล้ว`;
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      return `${diffHours} ชั่วโมงที่แล้ว`;
    }
  }
}
