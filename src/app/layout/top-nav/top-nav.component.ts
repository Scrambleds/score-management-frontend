import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { TranslationService } from '../../core/services/translation.service';
import { UserService } from '../../services/sharedService/userService/userService.service';
import { SignalRService } from '../../services/sharedService/signalRService/signal-r.service';
import { NotifyTemplateService } from '../../services/notify-template/notify-template.service';
import * as Handlebars from 'handlebars';

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

    //call template notify
    this.notifyTemplate.getTemplates().subscribe();

    //notify
    this.notifyTemplate
      .getNotifications(this.UserService.username)
      .subscribe((data) => {
        if (data && data.length > 0) {
          this.notifications = data.map((item) => {
            const notificationList = document.getElementById('notify-list');
            if (notificationList) {
              notificationList.innerHTML = ''; // ลบรายการเดิม

              data.forEach((item) => {
                const newItem = this.renderNotification(item); // Render Notification
                notificationList.appendChild(newItem); // เพิ่มรายการใน notify-list
              });
            }
          });
        } else {
          // หากไม่มีข้อมูลการแจ้งเตือน
          this.notifications = [];
        }
      });
    //notify signalR
    this.signalRService.startConnection(); // เริ่มการเชื่อมต่อกับ SignalR Hub
    this.signalRService.onNotification((notification: any) => {
      const renderedNotification = this.renderNotification(notification);
      const notificationList = document.getElementById('notify-list');
      if (notificationList) {
        // notificationList.appendChild(renderedNotification);
        // ถ้าไม่มีรายการใน list, firstChild จะเป็น null
        const firstItem = notificationList.firstChild;

        // แทรกรายการใหม่ที่ด้านบนสุด ถ้า firstItem เป็น null, renderedNotification จะถูกเพิ่มเป็นลูกแรก
        notificationList.insertBefore(renderedNotification, firstItem); // ถ้าไม่มี firstChild, ให้แทรก renderedNotification ที่ตำแหน่งแรก
      }
    });
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
  private renderNotification(item: any): HTMLElement {
    const htmlContent = this.notifyTemplate.getTemplateById(item.templateId); // ดึง Template จาก ID
    const template = Handlebars.compile(htmlContent); // คอมไพล์ Handlebars template
    const parsedData = JSON.parse(item.data); // แปลง JSON data
    const calculatedTime = this.notifyTemplate.calculateTime(item.createDate); // คำนวณเวลาที่ผ่านมา
    const renderedHtml = template({ ...parsedData, calculatedTime }); // Render template

    const li = document.createElement('li');
    li.innerHTML = renderedHtml;
    return li;
  }
}
