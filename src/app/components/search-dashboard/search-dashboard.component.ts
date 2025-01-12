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
import { SelectBoxService } from '../../services/select-box/select-box.service';

@Component({
  selector: 'app-search-dashboard',
  standalone: false,
  
  templateUrl: './search-dashboard.component.html',
  styleUrl: './search-dashboard.component.css'
})
export class SearchDashboardComponent implements OnInit {
  form!: FormGroup;
  sectionList: any[] = [];
  semesterList: any[] = [];
  academicYearList: any[] = [];
  scoreTypeList: any[] = [];

  constructor(private fb: FormBuilder, private selectBoxService: SelectBoxService){}

  formValues = {
    departmentCode: '',
    summary: '64,100',
    target: '100,000',
  };

  departmentOptions = [
    { id: '1', title: 'Department A' },
    { id: '2', title: 'Department B' },
    { id: '3', title: 'Department C' },
    // Add your options here
  ];

  ngOnInit(){
    this.form = this.fb.group({
      subject_detail: [null],
      academicYearCode: [null],
      semesterCode: [null],
      sectionCode: [null],
      scoreType: [null],
    });

    this.LoadScoreType();
    this.loadSection();
    this.loadSemester();
    this.loadAcademicYear();
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

  onDepartmentChange(event: any) {
    console.log('Department selected:', this.formValues.departmentCode);
  }
}