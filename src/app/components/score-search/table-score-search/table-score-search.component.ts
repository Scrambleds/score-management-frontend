import { Component, Input } from '@angular/core';
import { ScoreAnnouncementService } from '../../../services/score-announcement/score-announcement.service';
import { TranslationService } from '../../../core/services/translation.service';

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
  columnDefs: any[] = [];

  //   columnDefs = [
  //     {
  //       headerName: 'เลขที่',
  //       field: 'seat_no',
  //       flex: 0.5,
  //       minWidth: 60,  // Example minWidth
  //     },
  //     {
  //       headerName: 'รหัสนิสิต',
  //       field: 'student_id',
  //       headerStyle: { textAlign: 'center' },
  //       flex: 1,
  //       minWidth: 120, // ความกว้างขั้นต่ำ
  //     },
  //     {
  //       headerName: 'ชื่อ-นามสกุล',
  //       field: 'fullname',
  //       headerStyle: { textAlign: 'center' },
  //       flex: 2,
  //       valueGetter: (params: any) =>
  //         `${params.data.prefix_desc_th} ${params.data.firstname} ${params.data.lastname}`,
  //       minWidth: 200, // ความกว้างขั้นต่ำ
  //     },
  //     {
  //       headerName: 'รหัสสาขา',
  //       field: 'major_code',
  //       flex: 1,
  //       minWidth: 120, // ความกว้างขั้นต่ำ
  //     },
  //     {
  //       headerName: 'อีเมล',
  //       field: 'email',
  //       headerClass: 'text-center',
  //       flex: 2,
  //       minWidth: 180, // ความกว้างขั้นต่ำ
  //     },
  //     {
  //       headerName: 'คะแนนเก็บ',
  //       field: 'accumulated_score',
  //       headerClass: 'text-center',
  //       flex: 1,
  //       minWidth: 120, // ความกว้างขั้นต่ำ
  //     },
  //     {
  //       headerName: 'คะแนนกลางภาค',
  //       field: 'midterm_score',
  //       headerClass: 'text-center',
  //       flex: 1,
  //       minWidth: 120, // ความกว้างขั้นต่ำ
  //     },
  //     {
  //       headerName: 'คะแนนปลายภาค',
  //       field: 'final_score',
  //       headerClass: 'text-center',
  //       flex: 1,
  //       minWidth: 120, // ความกว้างขั้นต่ำ
  //     },
  //     {
  //       headerName: 'รวมคะแนน',
  //       field: 'total_score',
  //       flex: 1,
  //       headerClass: 'text-center',
  //       valueGetter: (params: any) =>
  //         params.data.accumulated_score +
  //         params.data.midterm_score +
  //         params.data.final_score,
  //       minWidth: 120, // ความกว้างขั้นต่ำ
  //     },
  // ];

  defaultColDef = {
    resizable: true,
    sortable: true,
  };

  constructor(private translationService: TranslationService) {
    this.generateColumnDefs();
  }

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
  generateColumnDefs() {
    this.columnDefs = [
      {
        headerName:
          this.translationService.getTranslation(
            'uploadscore_tableFieldSeatNo'
          ) || 'เลขที่',
        field: 'seat_no',
        flex: 0.5,
        minWidth: 60, // Example minWidth
      },
      {
        headerName:
          this.translationService.getTranslation('student_id') || 'รหัสนิสิต',
        field: 'student_id',
        headerStyle: { textAlign: 'center' },
        flex: 1,
        minWidth: 120, // ความกว้างขั้นต่ำ
      },
      {
        headerName:
          this.translationService.getTranslation(
            'uploadscore_tableFieldFirstName'
          ) +
            ' - ' +
            this.translationService.getTranslation(
              'uploadscore_tableFieldLastName'
            ) || 'ชื่อ-นามสกุล',
        field: 'fullname',
        headerStyle: { textAlign: 'center' },
        flex: 2,
        valueGetter: (params: any) =>
          `${params.data.prefix_desc_th} ${params.data.firstname} ${params.data.lastname}`,
        minWidth: 200, // ความกว้างขั้นต่ำ
      },
      {
        headerName:
          this.translationService.getTranslation(
            'uploadscore_tableFieldMajor'
          ) || 'รหัสสาขา',
        field: 'major_code',
        flex: 1,
        minWidth: 120, // ความกว้างขั้นต่ำ
      },
      {
        headerName:
          this.translationService.getTranslation(
            'uploadscore_tableFieldEmail'
          ) || 'อีเมล',
        field: 'email',
        headerClass: 'text-center',
        flex: 2,
        minWidth: 180, // ความกว้างขั้นต่ำ
      },
      {
        headerName:
          this.translationService.getTranslation(
            'uploadscore_tableFieldAccScore'
          ) || 'คะแนนระหว่างเรียน',
        field: 'accumulated_score',
        headerClass: 'text-center',
        flex: 1,
        minWidth: 120, // ความกว้างขั้นต่ำ
      },
      {
        headerName:
          this.translationService.getTranslation('midterm_score') ||
          'คะแนนกลางภาค',
        field: 'midterm_score',
        headerClass: 'text-center',
        flex: 1,
        minWidth: 120, // ความกว้างขั้นต่ำ
      },
      {
        headerName:
          this.translationService.getTranslation(
            'uploadscore_tableFieldFinScore'
          ) || 'คะแนนปลายภาค',
        field: 'final_score',
        headerClass: 'text-center',
        flex: 1,
        minWidth: 120, // ความกว้างขั้นต่ำ
      },
      {
        headerName:
          this.translationService.getTranslation('total_score') || 'รวมคะแนน',
        field: 'total_score',
        flex: 1,
        headerClass: 'text-center',
        valueGetter: (params: any) =>
          params.data.accumulated_score +
          params.data.midterm_score +
          params.data.final_score,
        minWidth: 120, // ความกว้างขั้นต่ำ
      },
    ];
    if (this.gridApi) {
      this.gridApi.setGridOption('rowData', this.gridData);
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
