import { Component } from '@angular/core';
import { ScoreAnnouncementService } from '../../services/score-announcement/score-announcement.service';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-score-announcement',
  standalone: false,

  templateUrl: './score-announcement.component.html',
  styleUrl: './score-announcement.component.css',
})
export class ScoreAnnouncementComponent {
  //สำหรับตัวอย่าง response ของ language
  gridData: any[] = [];
  jsonString = JSON.stringify(
    {
      isSuccess: false,
      message: {
        messageKey: '',
        messageDescription: '',
      },
      objectResponse: {
        welcome_message: 'Welcome {username}',
        logout: 'Logout',
        home: 'Home',
        insert_product: 'Insert a Product',
        language: 'Language',
        list: 'List',
        login: 'Login',
        login_user_not_found: '{username} not found',
        login_success: 'Welcome {username}',
        login_failed: 'username / password incorrect',
        chat: 'Chat',
        noti_template1:
          'There was an error sending. email to {student_name}\\ndetail : {error_detail}',
        menu_masterdata: 'Master Data management',
        menu_usermanage: 'User management',
        menu_uploadscore: 'Import student scores',
        menu_searchscore: 'Search score',
        menu_scoreannounce: 'Score announcements',
        menu_dashboard: 'Dashboard',
      },
    },
    null,
    2
  ); // Null, 2 for pretty-printing
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
    // ทำการรีเซ็ตข้อมูลทั้งหมด
    this.gridData = []; // หรือรีเซ็ตค่าตามที่ต้องการ
  }
  ngOnInit() {}

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
