import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import * as XLSX from 'xlsx';
import {
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  Validators,
} from '@angular/forms';
// import { UploadScoreHeaderComponent } from '../table-score-announcemen.component';
import Swal from 'sweetalert2';
import { ScoreAnnouncementService } from '../../../services/score-announcement/score-announcement.service';

@Component({
  selector: 'table-score-announcemen',
  standalone: false,

  templateUrl: './table-score-announcemen.component.html',
  styleUrl: './table-score-announcemen.component.css',
})
export class TableScoreAnnouncementComponent {
  @Input() gridData: any[] = [];
  selectedRows: any[] = [];
  pagination = true;
  paginationPageSize = 100;
  columnDefs = [
    {
      headerName: '',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      headerStyle: { textAlign: 'center' },
      flex: 0.4,
      minWidth: 20, 
    },
    {
      headerName: 'เลขที่',
      field: 'seat_no',
      flex: 0.5,
      minWidth: 80,  
    },
    {
      headerName: 'รหัสนิสิต',
      field: 'student_id',
      headerStyle: { textAlign: 'center' },
      flex: 1,
      minWidth: 120, 
    },
    {
      headerName: 'ชื่อ-นามสกุล',
      field: 'fullname',
      headerStyle: { textAlign: 'center' },
      flex: 2,
      valueGetter: (params: any) =>
        `${params.data.prefix_desc_th} ${params.data.firstname} ${params.data.lastname}`,
      minWidth: 200,  
    },
    { 
      headerName: 'รหัสสาขา', 
      field: 'major_code',
      flex: 1,
      minWidth: 120,  
    },
    {
      headerName: 'อีเมล',
      field: 'email',
      headerClass: 'text-center',
      flex: 2,
      minWidth: 180,  
    },
    {
      headerName: 'คะแนนเก็บ',
      field: 'accumulated_score',
      headerClass: 'text-center',
      flex: 1,
      minWidth: 120,  
    },
    {
      headerName: 'คะแนนกลางภาค',
      field: 'midterm_score',
      headerClass: 'text-center',
      flex: 1,
      minWidth: 120,  
    },
    {
      headerName: 'คะแนนปลายภาค',
      field: 'final_score',
      headerClass: 'text-center',
      flex: 1,
      minWidth: 120,  
    },
    {
      headerName: 'รวมคะแนน',
      field: 'total_score',
      flex: 1,
      headerClass: 'text-center',
      valueGetter: (params: any) =>
        params.data.accumulated_score +
        params.data.midterm_score +
        params.data.final_score,
      minWidth: 120,  
    },
    {
      headerName: 'สถานะ',
      field: 'send_status_code_desc_th',
      flex: 1,
      cellRenderer: (params: any) => {
        const sendStatus = params.value || '';
        const sendDesc = params.data.send_desc || '';
        return `
        <div style="position: relative;">
          <span title="${sendDesc}" style="cursor: pointer;">
            ${sendStatus}
          </span>
        </div>
      `;
      },
      minWidth: 120,  
    },
    {
      headerName: 'ส่งคะแนน',
      flex: 0.7,
      filter: false,
      headerClass: 'text-center',
      cellRenderer: () => {
        return `
    <div class="d-flex justify-content-center align-items-center" style="height: 100%;"><i class="bi bi-send" style="color: blue; font-size: 22px; cursor: pointer;" title="ส่งคะแนน"></i></div>
  `;
      },
      minWidth: 80,  
    },
];

defaultColDef = {
    resizable: true,
    sortable: true,
};

  
  constructor(private scoreService: ScoreAnnouncementService) {}
  // @Input() gridData: any[] = [];
  gridApi: any;

  // ใน ngOnInit หรือเมื่อ gridData ถูกอัปเดต
  ngOnChanges(): void {
    if (this.gridApi) {
      this.gridApi.setRowData(this.gridData); // รีเฟรชข้อมูล
    }
  }

  onGridReady(params: any): void {
    this.gridApi = params.api; // เก็บ API ไว้ใช้งาน
    const allColumnIds = params.columnApi.getAllColumns().map((col: any) => col.getId());
    params.columnApi.autoSizeColumns(allColumnIds); // ปรับขนาดคอลัมน์ให้เหมาะสมกับเนื้อหา
  }
}
