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

  filteredSuggestions: any[] = [];
  showSuggestions = true;
  filteredSubjects: { subjectCode: string; subjectName: string }[] = [];
  selectedSubjectCode: string = ''; // ตัวแปรที่เก็บค่าที่เลือก

  isAutocompleteVisible = false;
  isSubjectNameReadonly = false;
  isSubmit: boolean = true;

  isAcademicYearDisabled: boolean = true;
  isSemesterDisabled: boolean = true;
  isSectionCodeDisabled: boolean = true;
  isSearching: boolean = false; // ใช้สำหรับบอกว่ากำลังค้นหาหรือไม่
  selectedSubject: any = null; // เก็บข้อมูลที่ผู้ใช้เลือก

  statuses: Array<{ label: string; value: string }> = [];
  sectionLovItem: Array<{ label: string; value: string }> = [];
  semesterLovItem: Array<{ label: string; value: string }> = [];
  academic_yearLovItem: Array<{ label: string; value: string }> = [];

  suggestions$: Observable<any[]> = of([]);

  constructor(
    private fb: FormBuilder,
    private contantLovService: ContantService
  ) {}
  getLabelForValue(
    value: string,
    lookupArray: Array<{ label: string; value: string }>
  ): string {
    const found = lookupArray.find((item) => item.value === value);
    return found ? found.label : '';
  }
  getSectionLabelOrNull(
    value: string,
    lookupArray: Array<{ label: string; value: string }>
  ): string | null {
    if (!value) return null; // Return null if value is empty or undefined

    const found = lookupArray.find((item) => item.value === value);
    return found ? found.label : null; // Return label or null if not found
  }

  onReset() {
    this.form.reset();
    this.resetForm.emit();
  }

  ngOnInit(): void {
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

    this.form = this.fb.group({
      subjectSearch: ['', Validators.required],
      studentSearch: [{ value: '', disabled: true }],
      section: [{ value: null, disabled: true }],
      semester: [{ value: null, disabled: true }],
      academic_year: [{ value: null, disabled: true }],
      sendStatus: [{ value: null, disabled: true }],
    });

    const toggleFields = (value: string | null) => {
      if (value && value.trim() !== '') {
        // Enable fields when subjectSearch has a value
        this.form.get('studentSearch')?.enable();
        this.form.get('section')?.enable();
        this.form.get('semester')?.enable();
        this.form.get('academic_year')?.enable();
        this.form.get('sendStatus')?.enable();
      } else {
        this.form.get('studentSearch')?.disable();
        this.form.get('studentSearch')?.reset('');
        this.form.get('section')?.disable();
        this.form.get('section')?.reset(null);
        this.form.get('semester')?.disable();
        this.form.get('semester')?.reset(null);
        this.form.get('academic_year')?.disable();
        this.form.get('academic_year')?.reset(null);
        this.form.get('sendStatus')?.disable();
        this.form.get('sendStatus')?.reset(null);
      }
    };

    // Listen for changes in subjectSearch
    this.form.get('subjectSearch')?.valueChanges.subscribe(toggleFields);

    // Initialize form state based on initial subjectSearch value (in case there's an initial value)
    toggleFields(this.form.get('subjectSearch')?.value);

    this.showAutocomplete();
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

  showAutocomplete() {
    this.form
      .get('subjectSearch')
      ?.valueChanges.pipe(
        debounceTime(300), // เพิ่มดีเลย์เพื่อลดจำนวนคำขอ API
        switchMap((searchText: string) => {
          if (!searchText) return of([]); // คืนค่าเป็นอาเรย์ว่างหากไม่มีคำค้นหา
          return this.contantLovService.getDataByCondition(
            'api/ScoreAnnoucement/GetSubjectByCondition',
            { subjectSearch: searchText }
          );
        })
      )
      .subscribe((response: any) => {
        this.filteredSuggestions = response.objectResponse || [];
      });
  }
  onSubmit(): void {
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
            role= parsedUserInfo.role;
          } else {
            role= parsedUserInfo.role;
            teacher_code = parsedUserInfo.teacher_code;
          }
        } catch (error) {
          console.error('Error parsing userInfo from localStorage:', error);
        }
      } else {
        console.error('userInfo not found in localStorage');
      }

      // ตรวจสอบ sendStatus และกำหนดค่าเริ่มต้นหากไม่มีค่า

      const requestData = {
        teacher_code,
        subjectSearch: this.form.value.subjectSearch ?? '',
        studentSearch: this.form.value.studentSearch ?? '',
        semester: this.form.value.semester ?? null,
        section: this.getLabelForValue(
          this.form.value.section,
          this.sectionLovItem
        ),
        academic_year: this.getLabelForValue(
          this.form.value.academic_year,
          this.academic_yearLovItem
        ),
        send_status_code: this.form.value.sendStatus ?? '',
        role
      };

      this.searchSubmit.emit(requestData); // ส่ง requestData ไปยัง API
    } else {
      this.form.markAllAsTouched();
    }
  }

}
