import {
  Component,
  ElementRef,
  Input,
  OnInit,
  Output,
  ViewChild,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UploadScoreService } from '../../services/upload-score/upload-score.service';
import { SelectBoxService } from '../../services/select-box/select-box.service';
import { TranslationService } from '../../core/services/translation.service';
import { UserService } from '../../services/sharedService/userService/userService.service';

@Component({
  selector: 'app-upload-score-header',
  standalone: false,
  templateUrl: './upload-score-header.component.html',
  styleUrls: ['./upload-score-header.component.css'],
})
export class UploadScoreHeaderComponent implements OnInit, OnChanges {
  @Input() titleName: string = 'No title';
  @Input() buttonName: string = 'No title';

  @Input() isUploaded: boolean = false;

  //viewChild
  @ViewChild('subjectCode', { read: ElementRef }) subjectCodeRef?: ElementRef;
  @ViewChild('subjectName', { read: ElementRef }) subjectNameRef?: ElementRef;
  @ViewChild('formSubject', { static: false, read: ElementRef })
  formSubjectRef?: ElementRef;

  @Output() formSubmitted = new EventEmitter<FormGroup>(); // Emit form data when submitted

  public form: FormGroup;
  filteredSubjects: { subjectCode: string; subjectName: string }[] = [];
  subjectCodeValue?: string; // Add this property

  isAutocompleteVisible = false;
  isSubjectNameReadonly = false;
  isSubmit: boolean = true;
  showSuggestions: boolean = false;

  isAcademicYearDisabled: boolean = true;
  isSemesterDisabled: boolean = true;
  isSectionCodeDisabled: boolean = true;

  //masterData
  sectionList: any[] = [];
  semesterList: any[] = [];
  academicYearList: any[] = [];
  teacherList: any[] = [];

  //for send state to parent
  @Output() formStatusChange = new EventEmitter<boolean>();

  constructor(
    private fb: FormBuilder,
    private uploadScoreService: UploadScoreService,
    private selectBoxService: SelectBoxService,
    private translationService: TranslationService,
    private userService: UserService
  ) {
    this.form = this.fb.group({
      subjectCode: [
        '',
        [
          Validators.required,
          Validators.minLength(11), // ความยาวขั้นต่ำเป็น 11 ตัวอักษร (ตัวเลข 8 หลัก + ขีด + ตัวเลข 2 หลัก)
          Validators.pattern(/^\d{8}-\d{2}$/), // รูปแบบต้องเป็นตัวเลข 8 หลัก แล้วตามด้วยขีดแล้วตัวเลข 2 หลัก
        ],
      ],
      subjectName: ['', Validators.required],
      academicYearCode: [null, Validators.required],
      semesterCode: [null, Validators.required],
      sectionCode: [null, Validators.required],
      teacher: [null, Validators.required],
    });

    // ตรวจจับการเปลี่ยนแปลงของฟอร์ม
    this.form.statusChanges.subscribe((status) => {
      this.formStatusChange.emit(this.form.valid); // ส่ง true ถ้าฟอร์ม valid
    });
  }

  ngOnInit() {
    this.form.get('subjectCode')?.disable();
    // this.form.get('subjectName')?.disable();
    this.isSubjectNameReadonly = true;
    this.inputFormToggle(false);
    this.loadSection();
    this.loadSemester();
    this.loadAcademicYear();
    this.loadTeacher();
    this.subjectCodeValue = this.form.get('subjectCode')?.value;
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['isUploaded'] && !changes['isUploaded'].firstChange) {
      console.log('isUploaded changed:', this.isUploaded);
      if (this.isUploaded) {
        this.checkSubjectCode();
        const subjectCodeValue = this.form.get('subjectCode')?.value?.trim();
        this.fillDropdown(subjectCodeValue);
        // Auto select teacher
        const selectedTeacher = this.teacherList.find(
          (t) => t.teacherCode === this.userService.teacherCode
        );
        if (selectedTeacher) {
          this.form.get('teacher')?.setValue([selectedTeacher.teacherCode]);
        }
        this.form.get('subjectCode')?.enable();
      } else {
        this.form.get('subjectCode')?.disable();
        // this.form.get('subjectName')?.disable();
        this.isSubjectNameReadonly = true;
        this.inputFormToggle(false);
        // this.clearForm();
      }
    }
  }

  // Update form control manually when the value changes
  onSubjectCodeChange(newValue: string) {
    this.form.get('subjectCode')?.setValue(newValue);
  }

  checkSubjectCode() {
    const checkInputValue = (isNotEmpty: boolean) => {
      console.log('checkInputValue : ', isNotEmpty);
      if (isNotEmpty) {
        this.inputFormToggle(true);
      } else {
        // this.form.get('subjectName')?.disable();
        this.isSubjectNameReadonly = true;
        this.inputFormToggle(false);
      }
    };

    //check value not empty then enable input
    const isNotEmpty = this.form.get('subjectCode')?.value?.trim().length > 0;
    checkInputValue(isNotEmpty);

    //check event value change not empty then enable input
    this.form.get('subjectCode')?.valueChanges.subscribe((value) => {
      const isNotEmpty = value?.trim().length > 0;
      console.log('Is Input Not Empty:', isNotEmpty);
      checkInputValue(isNotEmpty);
    });
  }

  //load MasterData
  loadSection(): void {
    this.selectBoxService.getSystemParamSection().subscribe((resp) => {
      console.log(resp);
      this.sectionList = resp;
    });
  }

  loadSemester(): void {
    this.selectBoxService.getSystemParamSemester().subscribe((resp) => {
      console.log(resp);
      this.semesterList = resp;
    });
  }

  loadAcademicYear(): void {
    this.selectBoxService.getSystemParamAcademicYear().subscribe((resp) => {
      console.log(resp);
      this.academicYearList = resp;
    });
  }

  loadTeacher(): void {
    this.selectBoxService.getTeacher().subscribe((resp) => {
      console.log(resp);
      this.teacherList = resp;
    });
  }

  searchCode() {
    console.log('search code');
    //check subjectCode not Empty
    const subjectCodeValue = this.form.get('subjectCode')?.value;
    const isNotEmpty = subjectCodeValue?.trim().length > 0;
    console.log('isNotEmpty : ', isNotEmpty);
    if (!isNotEmpty) {
      // this.form.get('subjectName')!.reset();
      // this.form.get('subjectName')?.disable();
      this.isSubjectNameReadonly = true;
      return;
    }
    this.fillDropdown(subjectCodeValue);
  }

  fillDropdown(term: string) {
    this.uploadScoreService.searchSubjects(term).subscribe((results) => {
      console.log(results);
      //check subjectCode is valid and auto select to subjectName
      this.filteredSubjects = results;
      console.log('fillDropdown', this.filteredSubjects);
      if (this.filteredSubjects.length === 1) {
        console.log('filteredSubjects = 1');
        // มีข้อมูลในผลลัพธ์เพียงหนึ่งรายการ
        const subjectCode = this.filteredSubjects[0].subjectCode;
        const subjectName = this.filteredSubjects[0].subjectName;
        if (subjectCode.toUpperCase() === term.toUpperCase()) {
          // เงื่อนไขที่ต้องการตรวจสอบ
          this.form.get('subjectCode')!.setValue(term);
          this.form.get('subjectName')!.setValue(subjectName);
          // this.isSubjectNameReadonly = true;
          // this.form.get('subjectName')?.disable();
          this.isSubjectNameReadonly = true;
        } else {
          // ถ้า subjectCode ไม่ตรงกับที่ต้องการ
          this.form.get('subjectCode')!.setValue(term);
          // this.form.get('subjectName')!.reset();
          // this.form.get('subjectName')?.disable();
          // this.form.get('subjectName')?.enable();
          this.isSubjectNameReadonly = false;
        }
      } else if (this.filteredSubjects.length === 0) {
        console.log('filteredSubjects = 0');
        this.form.get('subjectCode')!.setValue(term);
        // this.form.get('subjectName')!.reset();
        // this.form.get('subjectName')?.enable();
        this.isSubjectNameReadonly = false;
      } else {
        console.log('filteredSubjects = else');
        this.isSubjectNameReadonly = false;
        // มีข้อมูลมากกว่าหนึ่งรายการ
        // this.form.get('subjectName')!.reset();
      }
    });
  }

  onSelectChange(selectedValue: any, controlName: string): void {
    if (selectedValue && selectedValue.value === null) {
      this.form.get(controlName)?.reset();
    }
  }

  //autocomplete
  showAutocomplete(): void {
    this.isAutocompleteVisible = true;
  }

  hideAutocomplete(): void {
    // Delay hiding to allow click event on autocomplete items to fire
    setTimeout(() => {
      this.isAutocompleteVisible = false;
    }, 100);
  }

  // 8. validate and send formdata to parent
  onSubmit(event: Event) {
    event.preventDefault(); // ป้องกันการรีเฟรชหน้า
    this.isSubmit = true;
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (this.form.valid) {
      console.log('ฟอร์ม ข้อมูลที่ส่ง: ', this.form.value);
      console.log('ฟอร์มถูกต้อง ข้อมูลที่ส่ง: ', this.form.getRawValue());
      const formData = this.form.getRawValue();
      //send formData to parent with event emitter
      this.formSubmitted.emit(formData);
      // Swal.fire({
      //   title: 'สำเร็จ',
      //   text: 'บันทึกข้อมูลเรียบร้อยแล้ว',
      //   icon: 'success',
      //   confirmButtonText: 'ตกลง',
      //   confirmButtonColor: 'var(--primary-color)',
      // });

      // this.form.reset();
    } else {
      console.log('ฟอร์มไม่ถูกต้อง ข้อผิดพลาด: ', this.form.errors);
    }
  }

  customSearchFn(term: string, item: any): boolean {
    return this.translationService.searchFn(term, item);
  }
  customSearchTeacherFn(term: string, item: any): boolean {
    return this.translationService.searchFn(term, item, {
      th: 'teacherName',
      en: 'teacherName',
    });
  }

  inputFormToggle(isClear: boolean) {
    if (!isClear) {
      this.form.get('academicYearCode')?.disable();
      this.form.get('semesterCode')?.disable();
      this.form.get('sectionCode')?.disable();
      this.form.get('teacher')?.disable();
    } else {
      this.form.get('academicYearCode')?.enable();
      this.form.get('semesterCode')?.enable();
      this.form.get('sectionCode')?.enable();
      this.form.get('teacher')?.enable();
    }
  }

  clearForm() {
    // this.inputFormToggle(true);
    console.log('clear form');
    this.form.reset({
      subjectCode: '',
      subjectName: '',
      academicYearCode: null,
      semesterCode: null,
      sectionCode: null,
      teacher: null,
    });
  }

  handleSubmitRequest() {
    if (this.form.valid) {
      this.onSubmit(new Event('submit')); // เรียกใช้ onSubmit โดยตรง
    }
  }

  // ค้นหาข้อมูลเมื่อมีการพิมพ์
  selectCode(subject: any) {
    this.form.get('subjectCode')?.setValue(subject.subjectCode);
    this.form.get('subjectName')?.setValue(subject.subjectName);
    this.isSubjectNameReadonly = true;
    this.showSuggestions = false;
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.showSuggestions = false;
    }
  }

  hideSuggestions() {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200); // ใช้ setTimeout เพื่อให้มีเวลาคลิกเลือก
  }

  onFocus() {
    // if (this.filteredSubjects.length > 0) {
    this.showSuggestions = true; // แสดง dropdown เมื่อมีข้อมูล
    // }
  }
}
