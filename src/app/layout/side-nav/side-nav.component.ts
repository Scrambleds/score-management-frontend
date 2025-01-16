import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-side-nav',
  standalone: false,
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.css'],
})
export class SideNavComponent {
  @Input() isOpen: boolean = false;
  @Output() toggle = new EventEmitter<void>();

  currentLang!: string; // สำหรับเก็บค่าภาษาปัจจุบัน

  constructor(private translationService: TranslationService) {}

  ngOnInit(): void {
    // เริ่มต้นให้ตรวจสอบภาษาปัจจุบัน
    this.translationService.getTranslations().subscribe((translations) => {
      this.currentLang = this.translationService.getCurrentLanguage(); // ดึงค่าภาษาปัจจุบันจากบริการ
      this.setLanguageToggle();
    });
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
