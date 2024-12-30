import {
  Component,
  ElementRef,
  AfterViewInit,
  Input,
  OnInit,
  Output,
  ViewChild,
  EventEmitter,
} from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
// import { UploadScoreService } from '../../services/upload-score/upload-score.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ScoreAnnouncementService } from '../../../services/score-announcement/score-announcement.service';

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

  //viewChild
  @ViewChild('subjectCode', { read: ElementRef }) subjectCodeRef?: ElementRef;
  // @ViewChild('subjectDetailForm', { static: false })
  // subjectDetailFormRef?: NgForm;
  @ViewChild('subjectDetailForm', { static: false })
  subjectDetailForm?: FormGroup;

  // @ViewChild('myForm') myForm!: NgForm;
  @Output() formSubmitted = new EventEmitter<FormGroup>(); // Emit form data when submitted

  // public form: FormGroup;
  filteredSubjects: { subjectCode: string; subjectName: string }[] = [];
  selectedSubjectCode: string = ''; // ตัวแปรที่เก็บค่าที่เลือก

  isAutocompleteVisible = false;
  isSubjectNameReadonly = false;
  isSubmit: boolean = true;

  isAcademicYearDisabled: boolean = true;
  isSemesterDisabled: boolean = true;
  isSectionCodeDisabled: boolean = true;

  sectionCodeOptions = [
    { value: null, label: 'กรุณาเลือก' },
    { value: '800', label: '800' },
    { value: '801', label: '801' },
    { value: '870', label: '870' },
    { value: '880', label: '880' },
  ];

  constructor(
    private fb: FormBuilder,
    private scoreAnnouncementService: ScoreAnnouncementService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      subjectCode: ['', Validators.required],
      subjectName: [''],
      student_name: [{ value: null, disabled: true }],
      sendStatus: [{ value: null, disabled: true }],
    });
  
    const toggleFields = (value: string | null) => {
      if (value) {
        this.form.get('student_name')?.enable();
        this.form.get('sendStatus')?.enable();
      } else {
        this.form.get('student_name')?.disable();
        this.form.get('sendStatus')?.disable();
      }
    };
  
    this.form.get('subjectName')?.valueChanges.subscribe(toggleFields);
    this.form.get('subjectCode')?.valueChanges.subscribe(toggleFields);
  }
  ngAfterViewInit() {}

  onSubmit() {
    console.log('asdfasdfasdfasdf');
    if (this.form.valid) {
      const userInfo = localStorage.getItem('userInfo');

      let score_create_by: string | null = null;
      let teacher_code: string | null = null;
      if (userInfo) {
        try {
          const parsedUserInfo = JSON.parse(userInfo); // แปลง JSON เป็น Object
          score_create_by = parsedUserInfo.teacher_code; // เข้าถึง key `teacher_code`
          teacher_code = parsedUserInfo.teacher_code; // เข้าถึง key `teacher_code`
        } catch (error) {
          console.error('Error parsing userInfo from localStorage:', error);
        }
      } else {
        console.error('userInfo not found in localStorage');
      }

      const requestData = {
        score_create_by,
        teacher_code,
        subject_id: this.form.value.subjectCode,
        academicYearCode: this.form.value.academicYearCode,
        semesterCode: this.form.value.semesterCode,
      };
      this.searchSubmit.emit(requestData);
    } else {
      console.error('Form is invalid');
    }
  }

  searchCode(term: string) {
    console.log('search code');
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

  selectSubject(item: any) {
    if (item && item.subjectName) {
      console.log('================selectName=======================');
      console.log(item);
      this.form
        .get('subjectName')!
        .setValue(item.subjectName, { emitEvent: false });
      // this.filteredSubjects = [];
    }
  }
  searchSubject(term: string) {
    console.log('search subject');
  }
}
