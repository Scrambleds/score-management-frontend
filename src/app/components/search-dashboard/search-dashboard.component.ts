import {
  Component,
  ElementRef,
  AfterViewInit,
  Input,
  OnInit,
  Output,
  ViewChild,
  EventEmitter,
  output,
} from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { SelectBoxService } from '../../services/select-box/select-box.service';
import { DashboardService } from '../../services/dashboard/dashboard.service';
import { ChangeDetectorRef } from '@angular/core';
import { DashboardComponent } from '../../route/dashboard/dashboard.component';
import { BellCurveComponent } from '../bell-curve/bell-curve.component';

@Component({
  selector: 'app-search-dashboard',
  standalone: false,
  
  templateUrl: './search-dashboard.component.html',
  styleUrl: './search-dashboard.component.css'
})
export class SearchDashboardComponent implements OnInit {
  // @ViewChild(BellCurveComponent) resetDashboard? : BellCurveComponent;
  @ViewChild(BellCurveComponent) bellcurve?: BellCurveComponent;
  @Output() dashboardDataUpdated = new EventEmitter<any>();
  @Output() cardRequest = new EventEmitter<any>();
  form!: FormGroup;
  sectionList: any[] = [];
  semesterList: any[] = [];
  academicYearList: any[] = [];
  scoreTypeList: any[] = [];
  dashboardData: any;
  dashboardComponent: any;

  constructor(private fb: FormBuilder, private selectBoxService: SelectBoxService
              ,private DashboardService: DashboardService, private cdr: ChangeDetectorRef
  ){}

  ngOnInit(){
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

  loadDashboardStats = (): void => { 
    this.DashboardService.getDashboardStats({}).subscribe((response) => {
      if (response.isSuccess) {
        this.dashboardData = response.objectResponse;
        console.log('Dashboard Data: ', this.dashboardData);
      }
    });
  }  

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

  LoadScoreType(): void {
    this.selectBoxService.getSystemParamScoreType().subscribe((resp) => {
      console.log(resp);
      this.scoreTypeList = resp;
    })
  }

  onSubmit() {
    const formData = this.form.value;
    console.log('Form Data:', formData);
  

    if (Object.values(formData).every(value => value === null || value === '')) {
      console.log('Form is empty, setting dashboard data to 0.');
  
      function resetScores(data: any) {
        return Object.keys(data).reduce((acc, key) => {
          if (typeof data[key] === "object" && !Array.isArray(data[key])) {
            acc[key] = resetScores(data[key]); // รีเซ็ตทุก key ใน object
          } else if (Array.isArray(data[key])) {
            acc[key] = []; // รีเซ็ต array เป็นว่าง
          } else {
            acc[key] = 0; // ตั้งค่าทุกตัวเลขเป็น 0
          }
          return acc;
        }, {} as any);
      }
      
      this.dashboardData = resetScores(this.dashboardData);
      this.dashboardDataUpdated.emit(this.dashboardData);
      this.cardRequest.emit(formData.score_type);
      
      return;
    }
  
    // Send a new request if form is not empty
    console.log('Sending request with data:', formData);
    this.DashboardService.getDashboardStats(formData).subscribe((response) => {
      if (response.isSuccess) {
        this.dashboardData = response.objectResponse;
        this.dashboardDataUpdated.emit(this.dashboardData);
        this.cardRequest.emit(formData.score_type);
        console.log('Updated Dashboard Data:', this.dashboardData);
      } else {
        this.dashboardData = null;
        this.dashboardDataUpdated.emit(this.dashboardData);
        this.cardRequest.emit(formData.score_type);
      }
    });
  }
}