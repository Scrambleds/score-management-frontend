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
import { UploadScoreService } from '../../services/upload-score/upload-score.service';
import { TranslationService } from '../../core/services/translation.service';
import { UserService } from '../../services/sharedService/userService/userService.service';

@Component({
  selector: 'app-admin-search',
  standalone: false,
  
  templateUrl: './admin-search.component.html',
  styleUrl: './admin-search.component.css'
})
export class AdminSearchComponent implements OnInit {
  form!: FormGroup;

  @Output() isSearchTriggered = new EventEmitter<any>();
  SearchTriggered = false;
  semesterList: any[] = [];
  academicYearList: any[] = [];
  tableData: any[] = [];
  initialTableData: any[] = [];  // เก็บข้อมูลที่ได้จาก API ครั้งแรก


  @Output() tableDataEvent = new EventEmitter<any>();

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

  loadSemester(): void {
    this.selectBoxService.getSystemParamSemester().subscribe((resp) => {
      this.semesterList = Array.isArray(resp) ? resp : resp.data;
    });
  }
  
  loadAcademicYear(): void {
    this.selectBoxService.getSystemParamAcademicYear().subscribe((resp) => {
      this.academicYearList = Array.isArray(resp) ? resp : resp.data;
    });
  }  
  
  onSearch(): void {
    console.log("Form Values:", this.form.value); // Debugging form data
    this.DashboardService.getTableData(this.form.value).subscribe((resp) => {
      console.log("API Response:", resp);
      this.tableData = resp;
      this.SearchTriggered = true
      this.tableDataEvent.emit(resp);
      this.isSearchTriggered.emit(this.SearchTriggered);
    }, (error) => {
      console.error("API Error:", error);
    });
  }

  public onReset(): void {
    this.tableData = [...this.initialTableData]; 
    this.tableDataEvent.emit(this.tableData);
    this.form.reset(); 
  }

  ngOnInit() {
    this.loadSemester();
    this.loadAcademicYear();
  
    const role = this.UserService.role;
    const teacher_code = this.UserService.teacherCode;
    console.log(role);
    console.log('MyteacherCode', teacher_code);
  
    this.form = this.fb.group({
      subject_id: [null, Validators.required],
      academic_year: [null, Validators.required],
      semester: [null, Validators.required],
      section: [null, Validators.required],
      score_type: [null, Validators.required],
    });
  
    // เรียก API ใน ngOnInit โดยไม่ต้องใช้ onSearch
    this.DashboardService.getTableData(this.form.value).subscribe((resp) => {
      console.log("API Response:", resp);
      this.initialTableData = resp;  // เก็บข้อมูลครั้งแรกที่ได้รับจาก API
      this.tableData = resp;  // แสดงข้อมูลในตาราง
      this.tableDataEvent.emit(resp);  // ส่งข้อมูลไปยัง parent component
    }, (error) => {
      console.error("API Error:", error);
    });
  }
}  