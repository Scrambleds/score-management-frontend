import { Component } from '@angular/core';
import { SearchScoreService } from '../../services/search-score/search-score.service';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-search-score',
  standalone: false,

  templateUrl: './search-score.component.html',
  styleUrl: './search-score.component.css',
})
export class SearchScoreComponent {
  gridData: any[] = [];
  payload = {
    teacher_code: null,
    subjectSearch: '',
    studentSearch: '',
    semester: null,
    section: null,
    academic_year: null,
    send_status_code: '',
  };

  constructor(private scoreService: SearchScoreService) {}

  ngOnInit(): void {
    this.loadInitialData(); // โหลดข้อมูลตอนเข้าหน้า
  }

  loadInitialData(): void {
    this.scoreService.getScoreAnnouncementByCondition(this.payload).subscribe(
      (response) => {
        this.gridData = response.objectResponse?.length ? response.objectResponse : [];
        console.log('Initial data loaded:', this.gridData);
      },
      (error) => {
        console.error('Error loading initial data:', error);
      }
    );
  }

  onSearchSubmit(requestData: any): void {
    this.scoreService.getScoreAnnouncementByCondition(requestData).subscribe(
      (response) => {
        this.gridData = response.objectResponse?.length ? response.objectResponse : [];
        console.log('Data received:', this.gridData);
      },
      (error) => {
        console.error('Error fetching scores:', error);
      }
    );
  }

  onResetForm(): void {

    this.onSearchSubmit(this.payload);
  }
}
