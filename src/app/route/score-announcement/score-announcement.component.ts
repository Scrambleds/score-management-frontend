import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ScoreAnnouncementService } from '../../services/score-announcement/score-announcement.service';

@Component({
  selector: 'app-score-announcement',
  standalone: false,

  templateUrl: './score-announcement.component.html',
  styleUrl: './score-announcement.component.css',
})
export class ScoreAnnouncementComponent {
  gridData: any[] = [];
  scoreForm!: FormGroup;
  teacherCode: string | null = null;
  rowData: any[] = []; // ข้อมูลสำหรับ ag-grid
  currentSubjectData: any = null;

  constructor(
    private scoreService: ScoreAnnouncementService,
    private fb: FormBuilder
  ) {
    this.scoreForm = this.fb.group({
      subjectId: [''],
      academicYearCode: [''],
      semesterCode: [''],
    });
  }
  onReset() {
    this.gridData = [];
  }

  ngOnInit() {}

  updateGridData(newData: any[]): void {
    this.gridData = newData;
  }

  onSearchSubmit(requestData: any) {
    this.scoreService.getScoreAnnouncementByCondition(requestData).subscribe(
      (response) => {
        // ตรวจสอบ response ว่ามีข้อมูลที่ต้องการ
        if (response.objectResponse && response.objectResponse.length > 0) {
          this.gridData = response.objectResponse; // อัปเดต gridData
          console.log('Data received:', this.gridData); // ดูข้อมูลที่ได้รับจาก API
        } else {
          console.warn('No data found for the given search criteria');
          this.gridData = [];
        }
      },
      (error) => {
        console.error('Error fetching scores:', error);
      }
    );
  }

  onCurrentSubjectHandle(subjectData: any) {
    this.currentSubjectData = subjectData;
  }
}
