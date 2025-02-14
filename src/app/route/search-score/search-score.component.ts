import { Component } from '@angular/core';
import { SearchScoreService } from '../../services/search-score/search-score.service';

@Component({
  selector: 'app-search-score',
  standalone: false,

  templateUrl: './search-score.component.html',
  styleUrl: './search-score.component.css',
})
export class SearchScoreComponent {
  gridData: any[] = [];
  lastSearchPayload: any = null;
  payload = {
    teacher_code: null,
    subjectSearch: '',
    studentSearch: '',
    semester: null,
    section: null,
    academic_year: null,
    send_status_code: '',
    role: null,
  };

  constructor(private scoreService: SearchScoreService) {}
  reloadData() {
    if (this.lastSearchPayload) {
      this.onSearchSubmit(this.lastSearchPayload); // ค้นหาข้อมูลเดิมอีกครั้ง
    }
  }
  ngOnInit(): void {}

  loadInitialData(): void {
    const userInfo = localStorage.getItem('userInfo');
    const parsedUserInfo = JSON.parse(userInfo!);
    if (parsedUserInfo.role == 1) {
      this.payload.role = parsedUserInfo.role;
    } else {
      this.payload.role = parsedUserInfo.role;
      this.payload.teacher_code = parsedUserInfo.teacher_code;
    }

    this.scoreService.getScoreAnnouncementByCondition(this.payload).subscribe(
      (response) => {
        this.gridData = response.objectResponse?.length
          ? response.objectResponse
          : [];
        console.log('Initial data loaded:', this.gridData);
      },
      (error) => {
        console.error('Error loading initial data:', error);
      }
    );
  }

  onSearchSubmit(requestData: any): void {
    this.lastSearchPayload = requestData;
    this.scoreService.getScoreAnnouncementByCondition(requestData).subscribe(
      (response) => {
        this.gridData = response.objectResponse?.length
          ? response.objectResponse
          : [];
        console.log('Data received:', this.gridData);
      },
      (error) => {
        console.error('Error fetching scores:', error);
      }
    );
  }

  onResetForm(): void {
    // this.onSearchSubmit(this.payload);
    this.gridData = [];
  }
}
