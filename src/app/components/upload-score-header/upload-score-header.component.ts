import {
  Component,
  ElementRef,
  AfterViewInit,
  Input,
  OnInit,
  Output,
  ViewChild,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { UploadScoreService } from '../../services/upload-score/upload-score.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { SelectBoxService } from '../../services/select-box/select-box.service';
import { BehaviorSubject } from 'rxjs';
import { TranslationService } from '../../core/services/translation.service';

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

  @Output() formSubmitted = new EventEmitter<FormGroup>(); // Emit form data when submitted

  public form: FormGroup;
  filteredSubjects: { subjectCode: string; subjectName: string }[] = [];
  selectedSubjectCode: string = ''; // ตัวแปรที่เก็บค่าที่เลือก

  isAutocompleteVisible = false;
  isSubjectNameReadonly = false;
  isSubmit: boolean = true;

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
    private translationService: TranslationService
  ) {
    this.form = this.fb.group({
      subjectCode: ['', Validators.required],
      subjectName: ['', Validators.required],
      academicYearCode: [{ value: null }, Validators.required],
      semesterCode: [{ value: null }, Validators.required],
      sectionCode: [{ value: null }, Validators.required],
      teacher: [{ value: null }, Validators.required],
    });

    // ตรวจจับการเปลี่ยนแปลงของฟอร์ม
    this.form.statusChanges.subscribe((status) => {
      this.formStatusChange.emit(this.form.valid); // ส่ง true ถ้าฟอร์ม valid
    });
  }

  ngOnInit() {
    this.form.get('subjectCode')?.disable();
    this.form.get('subjectName')?.disable();
    this.inputFormToggle(false);
    this.loadSection();
    this.loadSemester();
    this.loadAcademicYear();
    this.loadTeacher();
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['isUploaded'] && !changes['isUploaded'].firstChange) {
      console.log('isUploaded changed:', this.isUploaded);
      if (this.isUploaded) {
        this.checkSubjectCode();
      } else {
        this.form.get('subjectCode')?.disable();
        this.form.get('subjectName')?.disable();
        this.inputFormToggle(false);
        this.clearForm();
      }
    }
  }
  checkSubjectCode() {
    // ตรวจสอบว่ามี ViewChild หรือไม่
    if (!this.subjectCodeRef) {
      console.error('subjectCodeRef is not defined.');
      return;
    }
    // เข้าถึง input element
    const inputElement =
      this.subjectCodeRef.nativeElement.querySelector('input');
    if (!inputElement) {
      console.error('Input element not found inside subjectCodeRef.');
      return;
    }
    console.log('ngAfterViewInit: Input Element:', inputElement);
    // เพิ่ม Event Listener เพื่อฟังการเปลี่ยนแปลงค่า
    inputElement.addEventListener('input', (event: Event) => {
      const value = (event.target as HTMLInputElement).value.trim();
      console.log('Input Value:', value);
      // อัปเดตสถานะของตัวแปรที่ใช้ควบคุม ng-select
      const isNotEmpty = value.length > 0;
      console.log('Is Input Not Empty:', isNotEmpty);
      // ปรับปรุงการเปิด/ปิด ng-select จาก form control
      if (isNotEmpty) {
        this.inputFormToggle(true);
      } else {
        this.form.get('subjectName')?.disable();
        this.inputFormToggle(false);
      }
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

  searchCode(term: string) {
    console.log('search code');
    this.uploadScoreService.searchSubjects(term).subscribe((results) => {
      console.log(results);
      this.filteredSubjects = results;

      if (this.filteredSubjects.length === 1) {
        console.log('filteredSubjects = 1');
        // มีข้อมูลในผลลัพธ์เพียงหนึ่งรายการ
        const subjectCode = this.filteredSubjects[0].subjectCode;
        const subjectName = this.filteredSubjects[0].subjectName;
        if (subjectCode.toUpperCase() === term.toUpperCase()) {
          // เงื่อนไขที่ต้องการตรวจสอบ
          this.form.get('subjectCode')!.setValue(term, { emitEvent: false });
          this.form.get('subjectName')!.setValue(subjectName, {
            emitEvent: false,
          });
          this.isSubjectNameReadonly = true;
        } else {
          // ถ้า subjectCode ไม่ตรงกับที่ต้องการ
          this.isSubjectNameReadonly = false;
          this.form.get('subjectCode')!.setValue(term, { emitEvent: false });
          this.form.get('subjectName')!.reset();
          this.form.get('subjectName')?.disable();
        }
      } else if (this.filteredSubjects.length === 0) {
        console.log('filteredSubjects = 0');
        this.form.get('subjectCode')!.setValue(term, { emitEvent: false });
        this.form.get('subjectName')!.reset();
        this.form.get('subjectName')?.enable();
        this.isSubjectNameReadonly = false;
      } else {
        console.log('filteredSubjects = else');
        // มีข้อมูลมากกว่าหนึ่งรายการ
        this.isSubjectNameReadonly = false;
        this.form.get('subjectName')!.reset();
      }
    });
  }

  searchSubject(term: string) {
    console.log('search subject');
    this.uploadScoreService.searchSubjects(term).subscribe((results) => {
      console.log(results);
      this.filteredSubjects = results;

      if (this.filteredSubjects.length === 1) {
        console.log('filteredSubjects = 1');
        // มีข้อมูลในผลลัพธ์เพียงหนึ่งรายการ
        const subjectCode = this.filteredSubjects[0].subjectCode;
        const subjectName = this.filteredSubjects[0].subjectName;
        if (subjectCode.toUpperCase() === term.toUpperCase()) {
          // เงื่อนไขที่ต้องการตรวจสอบ
          this.form.get('subjectName')!.setValue(subjectName, {
            emitEvent: false,
          });
          this.isSubjectNameReadonly = true;
        } else {
          // ถ้า subjectCode ไม่ตรงกับที่ต้องการ
          this.isSubjectNameReadonly = false;
          this.form.get('subjectName')!.setValue(term, {
            emitEvent: false,
          });
        }
      } else if (this.filteredSubjects.length === 0) {
        console.log('filteredSubjects = 0');
        this.form.get('subjectName')!.setValue(term, { emitEvent: false });
      } else {
        console.log('filteredSubjects = else');
        // มีข้อมูลมากกว่าหนึ่งรายการ
        this.isSubjectNameReadonly = false;
        this.form.get('subjectName')!.reset();
      }
    });
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
      this.inputFormToggle(true);
      this.selectedSubjectCode = item.subjectCode;
      this.isSubjectNameReadonly = true;
      // this.filteredSubjects = [];
    }
  }

  onSelectChange(selectedValue: any, controlName: string): void {
    if (selectedValue && selectedValue.value === null) {
      this.form.get(controlName)?.reset();
    }
  }

  // ฟังก์ชันที่รับข้อมูลจาก select emitter
  onSubjectSelected(selectedItem: any): void {
    this.selectedSubjectCode = selectedItem.subjectCode;
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
  onSubmit() {
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
      // this.form.get('academicYearCode')?.setValue();
      // this.form.get('semesterCode')?.setValue();
      // this.form.get('sectionCode')?.setValue();
      // this.form.get('teacher')?.setValue();
      // this.form.get('subjectCode')?.disable();
      // this.form.get('subjectName')?.disable();
      this.form.get('academicYearCode')?.disable();
      this.form.get('semesterCode')?.disable();
      this.form.get('sectionCode')?.disable();
      this.form.get('teacher')?.disable();
    } else {
      // this.form.get('subjectCode')?.enable();
      // this.form.get('subjectName')?.enable();
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

    // // ถ้าต้องการรีเซ็ตค่าต่าง ๆ ที่เกี่ยวข้อง เช่น การปิด/เปิดฟอร์ม field
    // this.isAutocompleteVisible = false;
    // this.isSubjectNameReadonly = false;
    // this.isSubmit = true;

    // this.isAcademicYearDisabled = true;
    // this.isSemesterDisabled = true;
    // this.isSectionCodeDisabled = true;
  }
}
