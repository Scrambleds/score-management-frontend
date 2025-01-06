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
      flex: 0.5,
    },
    {
      headerName: 'ลำดับ',
      valueGetter: (params: any) => params.node.rowIndex + 1,
      flex: 0.7,
    },
    {
      headerName: 'รหัสนิสิต',
      field: 'student_id',
      headerStyle: { textAlign: 'center' },
      flex: 1,
    },
    {
      headerName: 'ชื่อ-นามสกุล',
      field: 'fullname',
      headerStyle: { textAlign: 'center' },
      flex: 2,
      valueGetter: (params: any) =>
        `${params.data.prefix_desc_th} ${params.data.firstname} ${params.data.lastname}`,
    },
    { headerName: 'รหัสสาขา', field: 'major_code', flex: 1 },
    {
      headerName: 'อีเมล',
      field: 'email',
      headerClass: 'text-center',
      flex: 2,
    },
    {
      headerName: 'คะแนนเก็บ',
      field: 'accumulated_score',
      headerClass: 'text-center',
      flex: 1,
    },
    {
      headerName: 'คะแนนกลางภาค',
      field: 'midterm_score',
      headerClass: 'text-center',
      flex: 1,
    },
    {
      headerName: 'คะแนนปลายภาค',
      field: 'final_score',
      headerClass: 'text-center',
      flex: 1,
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
    },
    { headerName: 'สถานะ', field: 'send_status_code_desc_th', flex: 1 },
    {
      headerName: 'ส่งคะแนน',
      flex: 0.7,
      filter: false,
      headerClass: 'text-center',
      cellRenderer: () => {
        return `
    <div class="d-flex justify-content-center align-items-center" style="height: 100%;">
      <i class="bi bi-send" style="color: blue; font-size: 22px; cursor: pointer;" title="ส่งคะแนน"></i>
    </div>
  `;
      },
    },
  ];

  defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true,
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
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }
}
