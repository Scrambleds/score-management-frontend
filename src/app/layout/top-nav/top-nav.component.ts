import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { TranslationService } from '../../core/services/translation.service';
import { UserService } from '../../services/sharedService/userService/userService.service';

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

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private translationService: TranslationService,
    private UserService: UserService
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
}
