import { Component, Input } from '@angular/core';
import { ScoreAnnouncementService } from '../../../services/score-announcement/score-announcement.service';

@Component({
  selector: 'table-score',
  standalone: false,
  templateUrl: './table-score-search.component.html',
  styleUrl: './table-score-search.component.css',
})
export class TableScoreSearchComponent {
  @Input() gridData: any[] = [];
  selectedRows: any[] = [];
  pagination = true;
  paginationPageSize = 100;
  columnDefs = [
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
  ];

  defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true,
  };

  constructor() {}
  // @Input() gridData: any[] = [];
  gridApi: any;

  // ใน ngOnInit หรือเมื่อ gridData ถูกอัปเดต
  ngOnChanges(): void {
    if (this.gridData && this.gridData.length > 0) {
      if (this.gridApi) {
        this.gridApi.setRowData(this.gridData); // รีเฟรชข้อมูล
        this.gridApi.sizeColumnsToFit(); // ปรับขนาดคอลัมน์ให้พอดีกับข้อมูล
      }
    }
  }

  onGridReady(params: any): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }
  ngAfterViewInit(): void {
    // ทำให้แน่ใจว่า sizeColumnsToFit ถูกเรียกหลังจาก grid ถูกโหลด
    if (this.gridApi) {
      this.gridApi.sizeColumnsToFit();
    }
  }
}
