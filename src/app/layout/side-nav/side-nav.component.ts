import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';
import { AuthGuard } from '../../auth/auth.guard';
import { UserService } from '../../services/sharedService/userService/userService.service';

@Component({
  selector: 'app-side-nav',
  standalone: false,
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.css'],
})
export class SideNavComponent {
  @Input() isOpen: boolean = false;
  @Output() toggle = new EventEmitter<void>();
  isMenuVisible = false;
  userRoles: string[] = [];
  showMasterData = false;
  showUserManagement = false;
  showUploadScore = false;
  showSearchScore = false;
  showScoreAnnouncement = false;
  showDashboard = false;
  userRole: any;

  currentLang!: string; // สำหรับเก็บค่าภาษาปัจจุบัน

  constructor(
    private translationService: TranslationService,
    private AuthGuard: AuthGuard,
    private UserService: UserService
  ) {}

  ngOnInit(): void {
    // this.waitForUserInfo().then(() => {
    // console.log(localStorage.getItem('userInfo')); // userInfo พร้อมใช้งานแล้ว

    this.userRole = this.UserService.role;
    console.log('MY USER ROLE!!: ', this.userRole);
    this.checkPermissions(this.userRole);
    // });
    // เริ่มต้นให้ตรวจสอบภาษาปัจจุบัน
    this.translationService.getTranslations().subscribe((translations) => {
      this.currentLang = this.translationService.getCurrentLanguage(); // ดึงค่าภาษาปัจจุบันจากบริการ
      this.setLanguageToggle();
    });
  }

  private waitForUserInfo(): Promise<void> {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          clearInterval(interval);
          resolve(); // ข้อมูลพร้อมแล้ว
        }
      }, 100); // ตรวจสอบทุก 100 มิลลิวินาที
    });
  }

  // ตรวจสอบ Role หากเป็น ผู้ดูแลระบบหรืออาจารย์มีสิทธิ์ที่จะเข้าถึงหน้าใดได้บ้าง
  checkPermissions(userRole: any) {
    // console.log("MY USER ROLE!!: ", userRole);
    // กำหนดการแสดงเมนูตาม role ของผู้ใช้
    if (userRole === 1) {
      console.log('Admin role');
      this.showMasterData = true;
      this.showUserManagement = true;
      this.showUploadScore = true;
      this.showScoreAnnouncement = true;
      this.showSearchScore = true;
      this.showDashboard = true;
    } else if (userRole === 2) {
      console.log('Teacher role');
      this.showUploadScore = true;
      this.showScoreAnnouncement = true;
      this.showSearchScore = true;
      this.showDashboard = true;
    }
  }

  // Close navigation
  closeNav() {
    this.toggle.emit(); // ส่ง Event กลับไปยัง Parent
  }

  // ฟังก์ชันสำหรับสลับภาษา
  switchLanguage(): void {
    const newLang = this.currentLang === 'en' ? 'th' : 'en'; // สลับระหว่าง ภาษาอังกฤษ และ ภาษาไทย
    this.translationService.changeLanguage(newLang); // ใช้บริการในการเปลี่ยนภาษา
    this.setLanguageToggle();
  }

  // ตั้งค่า switch toggle ให้ตรงกับค่าภาษา
  setLanguageToggle(): void {
    const toggle = document.getElementById('switch_lang') as HTMLInputElement;
    if (toggle) {
      toggle.checked = this.currentLang === 'en'; // ถ้าภาษาเป็น 'en' จะเช็ค toggle
    }
  }
}
