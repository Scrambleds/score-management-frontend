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

  constructor(private fb: FormBuilder, private selectBoxService: SelectBoxService,
              private DashboardService: DashboardService, private cdr: ChangeDetectorRef,
              private ExcelExportService: ExcelExportService) {}

  ngOnInit() {
    this.form = this.fb.group({
      subject_id: [null],
      academic_year: [null],
      semester: [null],
      section: [null],
      score_type: [null],
    });

    this.LoadScoreType();
    this.loadSection();
    this.loadSemester();
    this.loadAcademicYear();

    this.form.valueChanges.subscribe((values) => {
      console.log('Form changed: ', values);
      this.onSubmit();
      this.bellcurve?.refreshDashboard();
    });    
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

        // ดึงวันที่และเวลาปัจจุบัน
        // const now = new Date();
        // const formattedDateTime = format(now, "yyyy-MM-dd_HH-mm");

        // สร้างชื่อไฟล์
        // const fileName = `${requestData.subject_id}_${requestData.academic_year}_${requestData.semester}_${requestData.section}_${formattedDateTime}`;

        // this.downloadExcel(response.objectResponse.base64Excel, fileName);
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
