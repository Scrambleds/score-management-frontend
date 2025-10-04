import { Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';

@Pipe({
  name: 'translateDropdown',
  pure: false,
  standalone: false,
})
export class TranslateDropdownPipe implements PipeTransform {
  transform(
    item: any,
    fields: { th: string; en: string } = {
      th: 'byte_desc_th',
      en: 'byte_desc_en',
    }
  ): string {
    const lang = localStorage.getItem('language') || 'en'; // ตรวจสอบภาษาใน localStorage
    const field = fields[lang as keyof typeof fields]; // เลือก field ที่ตรงกับภาษา
    return item && item[field] ? item[field] : ''; // คืนค่า field หรือ string ว่างถ้าไม่มี
  }
}
