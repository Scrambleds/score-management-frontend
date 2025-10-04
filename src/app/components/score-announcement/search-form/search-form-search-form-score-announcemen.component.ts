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
import { debounceTime } from 'rxjs/operators';
import { ContantService } from '../../../shared/service/contants-service.service';
import { Observable, of } from 'rxjs';
import { ModalSendMailComponent } from '../../modal-send-mail/modal-send-mail.component';
import { SelectBoxService } from '../../../services/select-box/select-box.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'search-form-score-announcemen',
  standalone: false,
  templateUrl: './search-form-score-announcemen.component.html',
  styleUrls: ['./search-form-score-announcemen.component.css'],
})
export class SearchFormScoreAnnouncementComponent implements OnInit {
  @Input() titleName: string = 'No title';
  @Input() buttonName: string = 'No title';
  form!: FormGroup;
  gridData: any[] = [];
  @Output() searchSubmit = new EventEmitter<any>();
  @Output() resetForm = new EventEmitter<void>();
  @Output() currentSubject = new EventEmitter<any>();

  //viewchild
  @ViewChild('subjectCode', { read: ElementRef }) subjectCodeRef?: ElementRef;
  @ViewChild('subjectDetailForm', { static: false })
  subjectDetailForm?: FormGroup;
  @ViewChild(ModalSendMailComponent) modal?: ModalSendMailComponent;
  subjectList: any[] = [];

  filteredSuggestions: any[] = [];
  showSuggestions = true;
  filteredSubjects: { subjectCode: string; subjectName: string }[] = [];
  selectedSubjectCode: string = ''; // ตัวแปรที่เก็บค่าที่เลือก
  currentSubjectId: string = '';

  selectedSection: string = '';
  isAutocompleteVisible = false;
  isSubjectNameReadonly = false;
  isSubmit: boolean = true;

  private studentSearchEnabled = false;

  isAcademicYearDisabled: boolean = true;
  isSemesterDisabled: boolean = true;
  isSectionCodeDisabled: boolean = true;
  isSearching: boolean = false; // ใช้สำหรับบอกว่ากำลังค้นหาหรือไม่
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
    private selectBoxService: SelectBoxService,
    private translationService: TranslationService
  ) {
    this.loadSubjects();
    // สร้างฟอร์ม
    this.form = this.fb.group({
      subjectSearch: [null, Validators.required],
      studentSearch: [{ value: '' }],
      semester: [null, Validators.required],
      section: [null, Validators.required],
      sendStatus: [{ value: null }],
      academic_year: [null, Validators.required],
    });

    this.contantLovService
      .getLovContant('GetLovSendStatus')
      .subscribe((data) => {
        this.statuses = data;
      });
    this.contantLovService.getLovContant('GetLovSection').subscribe((data) => {
      this.sectionLovItem = data;
      console.log('section Lov item', this.sectionLovItem);
    });
    this.contantLovService.getLovContant('GetLovSemester').subscribe((data) => {
      this.semesterLovItem = data;
      console.log('semester Lov item', this.semesterLovItem);
    });
    this.contantLovService
      .getLovContant('GetLovAcademicYear')
      .subscribe((data) => {
        this.academic_yearLovItem = data;
        console.log('academic_year Lov item', this.academic_yearLovItem);
      });

    // เรียก toggleFields เพื่อให้ตั้งค่าเริ่มต้นของฟอร์ม
    this.toggleFields(this.form.value);
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
          subject_id: subject.subject_id, //อย่าเอาออก
        }));
      });
  }
  ngOnInit(): void {
    this.form.valueChanges.pipe(debounceTime(300)).subscribe((value) => {
      this.onSubmit();
      this.toggleFields(value);
    });
  }

  toggleFields(value: {
    subjectSearch?: string | null;
    academic_year?: string | null;
    semester?: string | null;
    section?: string | null;
  }) {
    const shouldEnableStudentSearch =
      String(value.subjectSearch || '').trim() &&
      String(value.academic_year || '').trim() &&
      String(value.semester || '').trim() &&
      String(value.section || '').trim();

    if (shouldEnableStudentSearch) {
      if (!this.studentSearchEnabled) {
        this.form.get('studentSearch')?.enable();
        this.form.get('sendStatus')?.enable();
        this.studentSearchEnabled = true;
      }
    } else {
      this.studentSearchEnabled = false;
      this.form.get('studentSearch')?.disable();
      this.form.get('studentSearch')?.reset(null);
      this.form.get('sendStatus')?.disable();
      this.form.get('sendStatus')?.reset(null);
    }
  }

  onReset() {
    this.form.reset();
    this.resetForm.emit(); // ส่ง requestData ไปยัง API
  }

  hideSuggestions(): void {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200); // เพิ่มดีเลย์เพื่อป้องกันการคลิกหาย
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    console.log('Submitting form...');
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

      // ตรวจสอบ sendStatus และกำหนดค่าเริ่มต้นหากไม่มีค่า
      this.currentSubjectId = this.form.value.subject_id;
      const requestData = {
        teacher_code,
        role,
        subjectSearch: this.form.value.subjectSearch.subjectSearch ?? '',
        studentSearch: this.form.value.studentSearch ?? '',
        semester: this.form.value.semester ?? null,
        section: this.form.value.section ?? '',
        subject_id: this.form.value.subjectSearch.subject_id ?? '',
        academic_year: this.form.value.academic_year ?? '',
        send_status_code: this.form.value.sendStatus ?? '',
      };

      this.searchSubmit.emit(requestData); // ส่ง requestData ไปยัง API

      //call updateCurrentSubject
      this.onCurrentSubject();
    } else {
      this.form.markAllAsTouched();
    }
  }

  selectCode(item: any) {
    if (item && item.subjectCode) {
      console.log('================selectCode=======================');
      console.log(item);
      this.form
        .get('subjectName')!
        .setValue(item.subjectName, { emitEvent: false });
      this.form
        .get('subjectCode')!
        .setValue(item.subjectCode, { emitEvent: false });
      this.selectedSubjectCode = item.subjectCode;
      this.isSubjectNameReadonly = true;
      // this.filteredSubjects = [];
    }
  }

  searchSubject(term: string) {
    console.log('search subject');
  }

  onUlClick(event: Event): void {
    console.log('UL clicked:', event);
  }

  onCurrentSubject() {
    const subjectData: {
      subject_id: string;
      academic_year: number;
      semester: number;
      section: number;
    } = {
      subject_id: this.form.value.subjectSearch.subject_id,
      academic_year: parseInt(this.form.value.academic_year),
      semester: parseInt(this.form.value.semester),
      section: parseInt(this.form.value.section),
    };
    console.log('current Subject : ', subjectData);
    this.currentSubject.emit(subjectData);
    // this.modal?.updateCurrentSubject(subjectData);
  }

  customSearchFn(term: string, item: any): boolean {
    return this.translationService.searchFn(term, item, {
      th: 'desc_th',
      en: 'desc_en',
    });
  }
}
