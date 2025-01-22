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

@Component({
  selector: 'app-search-dashboard',
  standalone: false,
  templateUrl: './search-dashboard.component.html',
  styleUrls: ['./search-dashboard.component.css']
})
export class SearchDashboardComponent implements OnInit {
  @ViewChild(BellCurveComponent) bellcurve?: BellCurveComponent;
  @Output() dashboardDataUpdated = new EventEmitter<any>();
  @Output() cardRequest = new EventEmitter<any>();
  form!: FormGroup;
  sectionList: any[] = [];
  semesterList: any[] = [];
  academicYearList: any[] = [];
  scoreTypeList: any[] = [];
  dashboardData: any;
  SubjectList: any[] = [];

  constructor(private fb: FormBuilder, private selectBoxService: SelectBoxService, private UploadScoreService: UploadScoreService,
              private DashboardService: DashboardService, private cdr: ChangeDetectorRef,
              private ExcelExportService: ExcelExportService) {}

loadMajor() {
  this.UploadScoreService.getSubject().subscribe((resp) => {
    console.log(resp);
    this.SubjectList = resp;
  });
}

  ngOnInit() {
    this.form = this.fb.group({
      subject_id: [null , Validators.required],
      academic_year: [null  , Validators.required],
      semester: [null , Validators.required],
      section: [null , Validators.required],
      score_type: [null],
    });

    this.resetAndDisableFields(['academic_year', 'semester', 'section', 'score_type']);
    this.dashboardData = this.resetScores(this.dashboardData);
    this.dashboardDataUpdated.emit(this.dashboardData);
    this.cardRequest.emit(null);
  
    this.loadMajor();
    this.LoadScoreType();
    this.loadSection();
    this.loadSemester();
    this.loadAcademicYear();

    this.form.statusChanges.subscribe(() => {
      this.updateExportButtonState();
    });

    this.form.get('subject_id')?.valueChanges.subscribe((value) => {
      if (!value) {
        // Reset the form fields and disable them
        this.resetAndDisableFields(['academic_year', 'semester', 'section', 'score_type']);
        
        // Reset dashboardData
        this.dashboardData = this.resetScores(this.dashboardData);
        this.dashboardDataUpdated.emit(this.dashboardData);
        this.cardRequest.emit(null);
      } else {
        // Enable the fields
        this.enableFields(['academic_year', 'semester', 'section', 'score_type']);
      }
    });

    this.form.valueChanges.subscribe((values) => {
      if (this.areRequiredFieldsValid()) {
        console.log('All required fields are valid, calling onSubmit');
        this.onSubmit();
        this.bellcurve?.refreshDashboard();
      } else {
        console.log('Required fields are not valid yet');
      }
    });

    // this.form.valueChanges.subscribe((values) => {
    //   console.log('Form changed: ', values);
    //   // this.onSubmit();
    //   this.bellcurve?.refreshDashboard();
    // });
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
    const { subject_id, academic_year, semester, section } = this.form.value;
    return subject_id !== null && academic_year !== null && semester !== null && section !== null;
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
    const { subject_id, academic_year, semester, section } = this.form.value;
    const allRequiredFieldsValid = subject_id !== null && academic_year !== null && semester !== null && section !== null;
    
    const exportButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    
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
    const requestData = this.form.value;
    console.log('Exporting with data:', requestData);
  
    this.ExcelExportService.getBase64Excel(requestData).subscribe(response => {
      console.log('Response from API:', response);
      if (response && response.file) {

        // ดึงวันที่และเวลาปัจจุบันในรูปแบบ "ปี-เดือน-วัน-ชั่วโมง-นาที"
        const now = new Date();

        // const formattedDateTime = format(now, "yyyy-MM-dd_HH-mm");

        const formattedDate = format(now, "yyyy-MM-dd");
        
        const formattedTime = format(now, "HH-mm");

        console.log("My formatTIME!!!: ",formattedTime);
        // const fileName = `${requestData.subject_id}_${requestData.academic_year}_${requestData.semester}_${requestData.section}_${formattedDateTime}`;

        const fileName = `${requestData.subject_id}_${requestData.academic_year}_${requestData.semester}_${requestData.section}_${formattedDate}_${formattedTime}`;
  
        this.downloadExcel(response.file, fileName);
      } else {
        console.error('No base64 data received');
      }
    }, error => {
      console.error('Error exporting Excel:', error);
    });    
  }

  downloadExcel(base64Data: string, fileName: string) {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

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

  LoadScoreType(): void {
    this.selectBoxService.getSystemParamScoreType().subscribe((resp) => {
      this.scoreTypeList = resp;
    });
  }

  onSubmit() {
    const formData = this.form.value;
    console.log('Form Data:', formData);
  
    // ตรวจสอบฟิลด์ที่จำเป็นก่อนยิง API
    if (
      !this.form.get('subject_id')?.value ||
      !this.form.get('academic_year')?.value ||
      !this.form.get('semester')?.value ||
      !this.form.get('section')?.value
      // !this.form.get('score_type')?.value
    ) {
      console.log('Cannot submit form, required fields are missing');
      return;
    }
  
    if (!this.form.get('subject_id')?.value) {
      console.log('subject_id is empty. Resetting dashboard data.');
      this.dashboardData = this.resetScores(this.dashboardData);
      this.dashboardDataUpdated.emit(this.dashboardData);
      this.cardRequest.emit(null); // หรือค่าที่ต้องการ
      return;
    }    
  
    if (Object.values(formData).every(value => value === null || value === '')) {
      console.log('Form is empty, setting dashboard data to 0.');
  
      function resetScores(data: any) {
        return Object.keys(data).reduce((acc, key) => {
          if (typeof data[key] === "object" && !Array.isArray(data[key])) {
            acc[key] = resetScores(data[key]);
          } else if (Array.isArray(data[key])) {
            acc[key] = [];
          } else {
            acc[key] = 0;
          }
          return acc;
        }, {} as any);
      }
  
      this.dashboardData = resetScores(this.dashboardData);
      this.dashboardDataUpdated.emit(this.dashboardData);
      this.cardRequest.emit(formData.score_type);
  
      return;
    }
  
    this.DashboardService.getDashboardStats(formData).subscribe((response) => {
      if (response.isSuccess) {
        this.dashboardData = response.objectResponse;
        this.dashboardDataUpdated.emit(this.dashboardData);
        this.cardRequest.emit(formData.score_type);
      } else {
        this.dashboardData = null;
        this.dashboardDataUpdated.emit(this.dashboardData);
        this.cardRequest.emit(formData.score_type);
      }
    });  
  }
}