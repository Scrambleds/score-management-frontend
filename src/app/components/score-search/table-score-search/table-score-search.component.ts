import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ScoreAnnouncementService } from '../../../services/score-announcement/score-announcement.service';
import { TranslationService } from '../../../core/services/translation.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'table-score',
  standalone: false,
  templateUrl: './table-score-search.component.html',
  styleUrl: './table-score-search.component.css',
})
export class TableScoreSearchComponent {
  @Input() gridData: any[] = [];
  @Output() refreshGrid = new EventEmitter<void>();
  selectedRows: any[] = [];
  pagination = true;
  columnDefs: any[] = [];

  defaultColDef = {
    resizable: true,
    sortable: true,
  };

  constructor(
    private translationService: TranslationService,
    private scoreAnnouncementService: ScoreAnnouncementService
  ) {
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
      {
        headerName:
          this.translationService.getTranslation('header_fleid_del') ||
          'ลบคะแนน',
        flex: 0.8,
        filter: false,
        minWidth: 100,
        cellRenderer: (params: any) => {
          const template = `
            <div class="d-flex justify-content-center align-items-center" style="height: 100%;">
              <i class="bi bi-trash" style="color: red; font-size: 20px; cursor: pointer;" title="ลบคะแนน"></i>
            </div>
          `;

          const wrapper = document.createElement('div');
          wrapper.innerHTML = template.trim();
          const div = wrapper.firstChild as HTMLElement;

          div.addEventListener('click', (event) => {
            event.stopPropagation();

            const { sys_subject_no, student_id } = params.data;

            if (!sys_subject_no || !student_id) {
              Swal.fire('เกิดข้อผิดพลาด', 'ไม่พบข้อมูลที่ต้องการลบ', 'error');
              return;
            }
            const title = this.translationService.getTranslation(
              'alrt_pwd_change_confirm_title'
            );
            const text = this.translationService.getTranslation(
              'alrt_del_score_confirm_text'
            );
            const confirmButtonText =
              this.translationService.getTranslation('btn_ok');
            const cancelButtonText =
              this.translationService.getTranslation('btn_cancel');

           

            Swal.fire({
              title: title,
              text: text,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#3085d6',
              cancelButtonColor: '#d33',
              confirmButtonText: confirmButtonText,
              cancelButtonText: cancelButtonText,
            }).then((result) => {
              if (result.isConfirmed) {
                const payload = { sys_subject_no, student_id };

                this.scoreAnnouncementService
                  .deleteScoreByCondition(payload)
                  .subscribe({
                    next: (response) => {
                      const title = this.translationService.getTranslation(
                        'alrt_del_score_success_text'
                      );
                      const text = this.translationService.getTranslation(
                        'alrt_del_score_success_title'
                      );
                      Swal.fire(
                        text,
                        title,
                        'success'
                      );
                      this.refreshGrid.emit();
                      params.api.refreshCells();
                    },
                    error: (error) => {
                      const title = this.translationService.getTranslation(
                        'sweet_alert_fail_title'
                      );
                      Swal.fire(
                        title,
                        error.message || 'ไม่สามารถลบคะแนนได้',
                        'error'
                      );
                    },
                  });
              }
            });
          });

          return div;
        },
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
