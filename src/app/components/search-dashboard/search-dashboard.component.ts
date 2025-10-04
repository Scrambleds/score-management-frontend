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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SelectBoxService } from '../../services/select-box/select-box.service';
import { DashboardService } from '../../services/dashboard/dashboard.service';
import { ChangeDetectorRef } from '@angular/core';
import { BellCurveComponent } from '../bell-curve/bell-curve.component';
import { ExcelExportService } from '../../services/excel-export/excel-export';
import { format } from 'date-fns';
import { UploadScoreService } from '../../services/upload-score/upload-score.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TranslationService } from '../../core/services/translation.service';
import { UserService } from '../../services/sharedService/userService/userService.service';

@Component({
  selector: 'app-search-dashboard',
  standalone: false,
  templateUrl: './search-dashboard.component.html',
  styleUrls: ['./search-dashboard.component.css'],
})
export class SearchDashboardComponent implements OnInit {
  @ViewChild(BellCurveComponent) bellcurve?: BellCurveComponent;
  @Output() dashboardDataUpdated = new EventEmitter<any>();
  @Output() cardRequested = new EventEmitter<any>();
  @Output() ScoreType = new EventEmitter<any>();
  @Output() RequestTable = new EventEmitter<any>();
  form!: FormGroup;
  sectionList: any[] = [];
  semesterList: any[] = [];
  academicYearList: any[] = [];
  scoreTypeList: any[] = [];
  dashboardData: any;
  cardValue: any;
  SubmitData: any;
  SubjectList: any[] = [];
  teacherCode: any;
  Role: any;

  constructor(
    private fb: FormBuilder,
    private selectBoxService: SelectBoxService,
    private UploadScoreService: UploadScoreService,
    private DashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
    private searchTranslateService: TranslationService,
    private ExcelExportService: ExcelExportService,
    private UserService: UserService
  ) {}

  loadMajor() {
    const role = this.UserService.role;
    const teacher_code = this.UserService.teacherCode;

    if (role === 2) {
      console.log('roledashboard', role);
      console.log('MyteacherCode', teacher_code);
      this.selectBoxService
        .getSubjectDashboard(teacher_code)
        .subscribe((resp) => {
          if (resp && Array.isArray(resp)) {
            this.SubjectList = resp;
          } else {
            console.error('Invalid data format for SubjectList:', resp);
          }
        });
    } else {
      const teacher_code = '';
      console.log('MyteacherCode', teacher_code);
      this.selectBoxService
        .getSubjectDashboard(teacher_code)
        .subscribe((resp) => {
          if (resp && Array.isArray(resp)) {
            this.SubjectList = resp;
          } else {
            console.error('Invalid data format for SubjectList:', resp);
          }
        });
    }
  }

  onRowSelected(selectedRow: any) {
    console.log('Selected Row Data:', selectedRow);
  }
  

  customSearchFn(term: string, item: any): boolean {
    term = term.toLowerCase();
    return (
      item.subjectCode.toLowerCase().includes(term) ||
      item.subjectName.toLowerCase().includes(term)
    );
  }

  customSearchFn_SearchLan(term: string, item: any): boolean {
    return this.searchTranslateService.searchFn(term, item);
  }

  // ngOnInit() {
  //   const role = this.UserService.role;
  //   const teacher_code = this.UserService.teacherCode;
  //   console.log(role);
  //   console.log('MyteacherCode', teacher_code);
  //   this.form = this.fb.group({
  //     subject_id: [null, Validators.required],
  //     academic_year: [null, Validators.required],
  //     semester: [null, Validators.required],
  //     section: [null, Validators.required],
  //     score_type: [null, Validators.required],
  //   });

  //   this.resetAndDisableFields([
  //     'academic_year',
  //     'semester',
  //     'section',
  //     'score_type',
  //   ]);
  //   this.dashboardData = this.resetScores(this.dashboardData);
  //   this.dashboardDataUpdated.emit(this.dashboardData);
  //   this.cardRequested.emit(null);

  //   this.loadMajor();
  //   this.LoadScoreType();
  //   this.loadSection();
  //   this.loadSemester();
  //   this.loadAcademicYear();

  //   this.form.statusChanges.subscribe(() => {
  //     this.updateExportButtonState();
  //   });

  //   this.form.get('subject_id')?.valueChanges.subscribe((value) => {
  //     if (!value) {
  //       // Reset the form fields and disable them
  //       this.resetAndDisableFields([
  //         'academic_year',
  //         'semester',
  //         'section',
  //         'score_type',
  //       ]);

  //       // Reset dashboardData
  //       this.dashboardData = this.resetScores(this.dashboardData);
  //       this.dashboardDataUpdated.emit(this.dashboardData);
  //       this.cardRequested.emit(null);

  //       this.RequestTable.emit(null);
  //     } else {
  //       // Enable the fields
  //       this.enableFields([
  //         'academic_year',
  //         'semester',
  //         'section',
  //         'score_type',
  //       ]);
  //     }
  //   });

  //   this.form.valueChanges.subscribe((values) => {
  //     if (this.areRequiredFieldsValid()) {
  //       console.log('All required fields are valid, calling onSubmit');
  //       this.onSubmit();
  //       this.bellcurve?.refreshDashboard();
  //     } else {
  //       console.log('Required fields are not valid yet');
  //     }
  //   });
  // }

  ngOnInit() {
    const role = this.UserService.role;
    const teacher_code = this.UserService.teacherCode;
    console.log(role);
    console.log('MyteacherCode', teacher_code);
  
    if (role === 2) {
    
    this.form = this.fb.group({
      subject_id: [null],
      academic_year: [null],
      semester: [null],
      section: [null],
      score_type: [null, Validators.required], // ไม่ต้องใส่ default ที่นี่
      teacher_code: teacher_code,
    });

  } else{
    this.form = this.fb.group({
      subject_id: [null],
      academic_year: [null],
      semester: [null],
      section: [null],
      score_type: [null, Validators.required], // ไม่ต้องใส่ default ที่นี่
      teacher_code: [null],
    });
  }

    teacher_code
    this.resetFields([
      'academic_year',
      'semester',
      'section',
      'score_type',
    ]);
  
    this.dashboardData = this.resetScores(this.dashboardData);
    this.dashboardDataUpdated.emit(this.dashboardData);
    this.cardRequested.emit(null);
  
    this.loadMajor();
    this.LoadScoreType(); // เรียกใช้งาน LoadScoreType() ที่นี่
    this.loadSection();
    this.loadSemester();
    this.loadAcademicYear();
  
    // เรียก API ทันทีเมื่อหน้าเว็บโหลด
    this.onSubmit(); // หรือคุณสามารถเรียกใช้ API ในฟังก์ชันนี้ได้ทันที
    
    this.form.valueChanges.subscribe((values) => {
      this.onSubmit(); // ทุกการเปลี่ยนแปลงจะส่ง API ทันที
    });
  }  
  
  LoadScoreType(): void {
    console.log('LOAD SCORE TYPE!!!!!!!!!!!!!!!!!!!!!!!')
    this.selectBoxService.getSystemParamScoreType().subscribe((resp) => {
      this.scoreTypeList = resp;
  
      // ตั้งค่า default value เป็น "คะแนนรวม"
      const defaultScoreType = this.scoreTypeList.find(
        (item) => item.byte_desc_th === 'คะแนนรวม'
      );

      console.log("MY DEFAULT SCORE TYPE", defaultScoreType);
  
      if (defaultScoreType) {
        this.form.patchValue({
          score_type: defaultScoreType.byte_desc_th
        });
      }
    });
  }
  
  // ฟังก์ชันนี้ไม่ต้อง disable ฟิลด์แล้ว
  resetFields(fields: string[]) {
    fields.forEach((field) => {
      const control = this.form.get(field);
      if (control) {
        control.reset(); // รีเซ็ตค่า
        control.enable(); // ทำให้ฟิลด์สามารถใช้งานได้
      }
    });
  }

  onSubmit() {
    // ส่ง API โดยไม่สนใจว่า field อะไรขาดหาย
    this.cardValue = this.form.getRawValue();
    this.SubmitData = this.form.getRawValue();
    console.log('Form Data:', this.SubmitData);

    // ส่ง API โดยใช้ค่าในฟอร์ม
    this.DashboardService.getDashboardStats(this.SubmitData).subscribe(
      (response) => {
        if (response.isSuccess) {
          this.dashboardData = response.objectResponse;
          this.dashboardDataUpdated.emit(this.dashboardData);
          this.cardRequested.emit(this.SubmitData.score_type);
          this.RequestTable.emit(this.SubmitData);
          console.log('Emitting SubmitData:', this.SubmitData.score_type);
        } else {
          this.dashboardData = null;
          this.dashboardDataUpdated.emit(this.dashboardData);
          this.cardRequested.emit(this.SubmitData.score_type);
          this.RequestTable.emit(this.SubmitData);
          console.log('Emitting SubmitData:', this.SubmitData.score_type);
        }
      }
    );
  }

  resetScores(data: any): any {
    if (!data) return null; // ตรวจสอบหากไม่มีข้อมูล

    return Object.keys(data).reduce((acc, key) => {
      if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
        acc[key] = this.resetScores(data[key]);
      } else if (Array.isArray(data[key])) {
        acc[key] = [];
      } else {
        acc[key] = 0; // หรือค่า default ที่ต้องการ
      }
      return acc;
    }, {} as any);
  }

  resetAndDisableFields(fields: string[]) {
    fields.forEach((field) => {
      const control = this.form.get(field);
      if (control) {
        control.reset(); // รีเซ็ตค่า
        control.disable(); // ปิดการใช้งาน
      }
    });
  }

  areRequiredFieldsValid(): boolean {
    const { subject_id, academic_year, semester, section, score_type } =
      this.form.value;
    return (
      subject_id !== null &&
      academic_year !== null &&
      semester !== null &&
      section !== null &&
      score_type !== null
    );
  }

  disableFields(fields: string[]) {
    fields.forEach((field) => this.form.get(field)?.disable());
  }

  // Enable ฟิลด์
  enableFields(fields: string[]) {
    fields.forEach((field) => this.form.get(field)?.enable());
  }

  // อัปเดตสถานะปุ่ม Export
  updateExportButtonState() {
    // ตรวจสอบแค่ฟิลด์ที่จำเป็น (ไม่รวม `score_type`)
    const { subject_id, academic_year, semester, section, score_type } =
      this.form.value;
    const allRequiredFieldsValid =
      subject_id !== null &&
      academic_year !== null &&
      semester !== null &&
      section !== null &&
      score_type !== null;

    const exportButton = document.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;

    if (exportButton) {
      exportButton.disabled = !allRequiredFieldsValid;
    }
  }

  ngAfterViewInit() {
    if (this.bellcurve) {
      console.log('BellCurveComponent is available');
    }
  }

  exportExcel() {
    const requestData = [this.form.value];
    console.log('Exporting with data:', requestData);
  
    this.ExcelExportService.getBase64Excel(requestData).subscribe(
      (response) => {
        console.log('Response from API:', response);
  
        // ตรวจสอบว่า response เป็น array หรือไม่ และมี file อยู่ในโครงสร้าง
        if (response && response.length > 0 && response[0]?.file) {
          const base64Data = response[0].file;
          console.log('Base64 data:', base64Data);
          this.downloadExcel(base64Data, 'test');
        } else {
          console.error('No base64 data found in response');
        }
      },
      (error) => {
        console.error('Error exporting Excel:', error);
      }
    );
  }  

  downloadExcel(base64Data: string, fileName: string) {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  loadDashboardStats = (): void => {
    // const requestData = this.form.value;

    this.DashboardService.getDashboardStats({}).subscribe((response) => {
      if (response.isSuccess) {
        this.dashboardData = response.objectResponse;
        console.log('Dashboard Data: ', this.dashboardData);
      }
    });
  };

  LoadSubjectDashboard(): void {
    this.selectBoxService.getSubjectDashboard().subscribe((resp) => {
      this.sectionList = resp;
    });
  }

  loadSection(): void {
    this.selectBoxService.getSystemParamSection().subscribe((resp) => {
      this.sectionList = resp;
    });
  }

  loadSemester(): void {
    this.selectBoxService.getSystemParamSemester().subscribe((resp) => {
      this.semesterList = resp;
    });
  }

  loadAcademicYear(): void {
    this.selectBoxService.getSystemParamAcademicYear().subscribe((resp) => {
      this.academicYearList = resp;
    });
  }

  // onSubmit() {
  //   // const formData = this.form.value;
  //   this.cardValue = this.form.getRawValue();
  //   this.SubmitData = this.form.getRawValue();
  //   console.log('Form Data:', this.SubmitData);

  //   // ตรวจสอบฟิลด์ที่จำเป็นก่อนยิง API
  //   if (
  //     !this.form.get('subject_id')?.value ||
  //     !this.form.get('academic_year')?.value ||
  //     !this.form.get('semester')?.value ||
  //     !this.form.get('section')?.value
  //     // !this.form.get('score_type')?.value
  //   ) {
  //     console.log('Cannot submit form, required fields are missing');
  //     return;
  //   }

  //   if (!this.form.get('subject_id')?.value) {
  //     console.log('subject_id is empty. Resetting dashboard data.');
  //     this.dashboardData = this.resetScores(this.dashboardData);
  //     this.dashboardDataUpdated.emit(this.dashboardData);
  //     this.cardRequested.emit(this.SubmitData.score_type);
  //     this.RequestTable.emit(null);
  //     console.log('Emitting SubmitData:', this.SubmitData.score_type);
  //     return;
  //   }

  //   if (
  //     Object.values(this.SubmitData).every(
  //       (value) => value === null || value === ''
  //     )
  //   ) {
  //     console.log('Form is empty, setting dashboard data to 0.');

  //     function resetScores(data: any) {
  //       return Object.keys(data).reduce((acc, key) => {
  //         if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
  //           acc[key] = resetScores(data[key]);
  //         } else if (Array.isArray(data[key])) {
  //           acc[key] = [];
  //         } else {
  //           acc[key] = 0;
  //         }
  //         return acc;
  //       }, {} as any);
  //     }

  //     this.dashboardData = resetScores(this.dashboardData);
  //     this.dashboardDataUpdated.emit(this.dashboardData);
  //     this.cardRequested.emit(this.SubmitData.SubmitData);
  //     this.RequestTable.emit(this.SubmitData);
  //     console.log('Emitting SubmitData:', this.SubmitData.score_type);

  //     return;
  //   }

  //   this.DashboardService.getDashboardStats(this.SubmitData).subscribe(
  //     (response) => {
  //       if (response.isSuccess) {
  //         this.dashboardData = response.objectResponse;
  //         this.dashboardDataUpdated.emit(this.dashboardData);
  //         this.cardRequested.emit(this.SubmitData.score_type);
  //         this.RequestTable.emit(this.SubmitData);
  //         console.log('Emitting SubmitData:', this.SubmitData.score_type);
  //       } else {
  //         this.dashboardData = null;
  //         this.dashboardDataUpdated.emit(this.dashboardData);
  //         this.cardRequested.emit(this.SubmitData.score_type);
  //         this.RequestTable.emit(this.SubmitData);
  //         console.log('Emitting SubmitData:', this.SubmitData.score_type);
  //       }
  //     }
  //   );
  // }
}
