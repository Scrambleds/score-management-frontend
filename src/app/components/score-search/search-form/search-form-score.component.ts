import {
  Component,
  ElementRef,
  Input,
  OnInit,
  Output,
  ViewChild,
  EventEmitter,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { UploadScoreService } from '../../services/upload-score/upload-score.service';
import { debounceTime, switchMap } from 'rxjs/operators';
import { ContantService } from '../../../shared/service/contants-service.service';
import { Observable, of } from 'rxjs';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'search-form-score',
  standalone: false,
  templateUrl: './search-form-score.component.html',
  styleUrls: ['./search-form-score.component.css'],
})
export class SearchFormScoreComponent implements OnInit {
  @Input() titleName: string = 'No title';
  @Input() buttonName: string = 'No title';
  form!: FormGroup;
  gridData: any[] = [];
  @Output() searchSubmit = new EventEmitter<any>();
  @Output() resetForm = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<FormGroup>(); // Emit form data when submitted
  @ViewChild('subjectCode', { read: ElementRef }) subjectCodeRef?: ElementRef;
  @ViewChild('subjectDetailForm', { static: false })
  subjectDetailForm?: FormGroup;
  subjectList: any[] = [];
  filteredSuggestions: any[] = [];
  showSuggestions = true;
  filteredSubjects: { subjectCode: string; subjectName: string }[] = [];
  selectedSubjectCode: string = ''; // ตัวแปรที่เก็บค่าที่เลือก
  academicYearItem: string = '';
  sectionItem: string = '';
  isAutocompleteVisible = false;
  isSubjectNameReadonly = false;
  isSubmit: boolean = true;

  isAcademicYearDisabled: boolean = true;
  isSemesterDisabled: boolean = true;
  isSectionCodeDisabled: boolean = true;
  isSearchingStudent: boolean = false; // ใช้สำหรับบอกว่ากำลังค้นหาหรือไม่
  selectedSubject: any = null; // เก็บข้อมูลที่ผู้ใช้เลือก

  statuses: { desc_th: string; desc_en: string; placeholder_key: string }[] =
    [];
  sectionLovItem: {
    desc_th: string;
    desc_en: string;
    placeholder_key: string;
  }[] = [];
  semesterLovItem: {
    desc_th: string;
    desc_en: string;
    placeholder_key: string;
  }[] = [];
  academic_yearLovItem: {
    desc_th: string;
    desc_en: string;
    placeholder_key: string;
  }[] = [];

  suggestions$: Observable<any[]> = of([]);

  constructor(
    private fb: FormBuilder,
    private contantLovService: ContantService,
    private translationService: TranslationService
  ) {
    // สร้างฟอร์ม
    this.form = this.fb.group({
      subjectSearch: [null, Validators.required],
      studentSearch: [{ value: '', disabled: true }],
      section: [null, Validators.required],
      semester: [null, Validators.required],
      academic_year: [null, Validators.required],
    });
    this.toggleFields(this.form.value);
    this.loadSubjects();
    // ดึงข้อมูลจาก API และเก็บไว้ในตัวแปร
    this.contantLovService
      .getLovContant('GetLovSendStatus')
      .subscribe((data) => {
        this.statuses = data;
      });
    this.contantLovService.getLovContant('GetLovSection').subscribe((data) => {
      this.sectionLovItem = data;
    });
    this.contantLovService.getLovContant('GetLovSemester').subscribe((data) => {
      this.semesterLovItem = data;
    });
    this.contantLovService
      .getLovContant('GetLovAcademicYear')
      .subscribe((data) => {
        this.academic_yearLovItem = data;
      });

    // เรียก toggleFields เพื่อให้ตั้งค่าเริ่มต้นของฟอร์ม
    this.toggleFields(this.form.value);
  }

  ngOnInit(): void {
    this.form.valueChanges.pipe(debounceTime(300)).subscribe((value) => {
        this.onSubmit();
        this.toggleFields(value);
    });
  }

  loadSubjects() {
    const userInfo = localStorage.getItem('userInfo');
    let teacher_code: string | null = null;
    let role: string | null = null;
    if (userInfo) {
      const parsedUserInfo = JSON.parse(userInfo);
      if (parsedUserInfo.role == 1) {
        teacher_code = '';
        role = parsedUserInfo.role;
      } else {
        role = parsedUserInfo.role;
        teacher_code = parsedUserInfo.teacher_code;
      }
    }
    const requestData = { role, teacher_code };
    this.contantLovService
      .getDataByCondition('api/LovContant/GetLovSubject', requestData)
      .subscribe((data: any) => {
        this.subjectList = (data.objectResponse || []).map((subject: any) => ({
          subjectSearch: `${subject.subject_id} ${subject.subject_name}`,
        }));
      });
  }
  // ฟังก์ชันที่ตรวจสอบค่าของฟอร์มเพื่อเปิด/ปิดฟิลด์
  toggleFields(value: {
    subjectSearch?: string | null;
    academic_year?: string | null;
    section?: string | null;
    semester?: string | null;
  }) {
    const isString =
      String(value.subjectSearch || '').trim() &&
      String(value.academic_year || '').trim() &&
      String(value.semester || '').trim() &&
      String(value.section || '').trim();
    if (isString) {
      if (!this.isSearchingStudent) {
        this.form.get('studentSearch')?.enable();
        this.isSearchingStudent = true;

      }
    } else {
      this.isSearchingStudent = false;
      this.form.get('studentSearch')?.disable();
      this.form.get('studentSearch')?.reset('');
    }
  }

  selectSubject(subject: any): void {
    this.form.patchValue({
      subjectSearch: `${subject.subject_id} ${subject.subject_name}`,
    });
    this.filteredSuggestions = [];
    this.showSuggestions = false;
  }

  hideSuggestions(): void {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200); // เพิ่มดีเลย์เพื่อป้องกันการคลิกหาย
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.valid) {
      const userInfo = localStorage.getItem('userInfo');
      let teacher_code: string | null = null;
      let role: string | null = null;

      if (userInfo) {
        try {
          const parsedUserInfo = JSON.parse(userInfo);
          if (parsedUserInfo.role == 1) {
            teacher_code = '';
            role = parsedUserInfo.role;
          } else {
            role = parsedUserInfo.role;
            teacher_code = parsedUserInfo.teacher_code;
          }
        } catch (error) {
          console.error('Error parsing userInfo from localStorage:', error);
        }
      } else {
        console.error('userInfo not found in localStorage');
      }
      const requestData = {
        teacher_code,
        subjectSearch: this.form.value.subjectSearch.subjectSearch ?? '',
        studentSearch: this.form.value.studentSearch ?? '',
        semester: this.form.value.semester ?? '',
        section: this.form.value.section ?? '',
        academic_year: this.form.value.academic_year ?? '',
        role,
      };

      this.searchSubmit.emit(requestData); // ส่ง requestData ไปยัง API
    } else {
      this.form.markAllAsTouched();
    }
  }

  onReset() {
    this.form.reset();
    this.resetForm.emit();
  }

  customSearchFn(term: string, item: any): boolean {
    return this.translationService.searchFn(term, item, {
      th: 'desc_th',
      en: 'desc_en',
    });
  }
}
