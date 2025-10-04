import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslationService } from '../../../core/services/translation.service';
import Swal from 'sweetalert2';
import { SearchScoreService } from '../../../services/search-score/search-score.service';
import { GridOptions } from 'ag-grid-community';

@Component({
  selector: 'table-score',
  standalone: false,
  templateUrl: './table-score-search.component.html',
  styleUrl: './table-score-search.component.css',
})
export class TableScoreSearchComponent {
  gridApi: any;
  @Input() gridData: any[] = [];
  @Output() refreshGrid = new EventEmitter<void>();
  selectedRows: any[] = [];
  pagination = true;
  columnDefs: any[] = [];

  gridOptions?: GridOptions;

  defaultColDef = {
    resizable: true,
    sortable: true,
  };

  constructor(
    private translationService: TranslationService,
    private scoreService: SearchScoreService
  ) {
    // this.generateColumnDefs();
    this.gridOptions = {
      columnDefs: this.columnDefs,
      defaultColDef: this.defaultColDef,
    };
  }

  ngOnInit() {
    this.translationService.getTranslations().subscribe(() => {
      // this.generateColumnDefs(); // รีเฟรชชื่อคอลัมน์เมื่อเปลี่ยนภาษา
      console.log('change lang done!');
      console.log(
        this.translationService.getTranslation('uploadscore_tableFieldSeatNo')
      );
      this.refreshHeaderNames(); // รีเฟรชชื่อคอลัมน์เมื่อเปลี่ยนภาษา
    });
  }

  generateColumnDefs() {
    return [
      {
        headerName:
          this.translationService.getTranslation(
            'uploadscore_tableFieldSeatNo'
          ) || 'เลขที่นั่ง',
        field: 'seat_no',
        flex: 0.5,
        minWidth: 60,
        comparator: (valueA: string, valueB: string) => {
          const regex = /^([A-Za-z]*)(\d*)$/; // แยกตัวอักษรและตัวเลข
          const matchA = valueA.match(regex);
          const matchB = valueB.match(regex);

          if (!matchA || !matchB) return valueA.localeCompare(valueB);

          const [_, letterA, numberA] = matchA;
          const [__, letterB, numberB] = matchB;

          if (!letterA && letterB) return -1;
          if (!letterB && letterA) return 1;

          const letterCompare = letterA.localeCompare(letterB);
          if (letterCompare !== 0) return letterCompare;

          return Number(numberA) - Number(numberB);
        },
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
        cellRenderer: (params: any) => {
          const value = params.value;
          return this.ScoreNullCellRenderer(value);
        },
      },
      {
        headerName:
          this.translationService.getTranslation('midterm_score') ||
          'คะแนนกลางภาค',
        field: 'midterm_score',
        headerClass: 'text-center',
        flex: 1,
        minWidth: 120, // ความกว้างขั้นต่ำฃ
        cellRenderer: (params: any) => {
          const value = params.value;
          return this.ScoreNullCellRenderer(value);
        },
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
        cellRenderer: (params: any) => {
          const value = params.value;
          return this.ScoreNullCellRenderer(value);
        },
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
              confirmButtonColor: 'var(--danger-color)',
              cancelButtonColor: 'var(--secondary-color)',
              confirmButtonText: confirmButtonText,
              cancelButtonText: cancelButtonText,
            }).then((result) => {
              if (result.isConfirmed) {
                const payload = { sys_subject_no, student_id };

                this.scoreService.deleteScoreByCondition(payload).subscribe({
                  next: (response) => {
                    const title = this.translationService.getTranslation(
                      'alrt_del_score_success_text'
                    );
                    const text = this.translationService.getTranslation(
                      'alrt_del_score_success_title'
                    );
                    Swal.fire({
                      text: title,
                      title: text,
                      icon: 'success',
                      confirmButtonColor: '#0d6efd',
                    });
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

  private ScoreNullCellRenderer(value: any): string {
    if (
      value === null ||
      value === undefined ||
      value.toString().trim() === ''
    ) {
      return `<span style="color: red; font-weight: bold; background-color: #ffcccc; padding: 2px 5px; border-radius: 3px;">NULL</span>`;
    }
    return value.toFixed(2);
  }

  onGridReady(params: any): void {
    this.gridApi = params.api;
    if (this.gridApi) {
      console.log('gridReady api work');
      this.refreshHeaderNames();
    } else {
      console.log('gridReady api not work');
    }
    this.gridApi.sizeColumnsToFit();
  }
  ngAfterViewInit(): void {
    // ทำให้แน่ใจว่า sizeColumnsToFit ถูกเรียกหลังจาก grid ถูกโหลด
    if (this.gridApi) {
      this.gridApi.sizeColumnsToFit();
    }
  }
  // ฟังก์ชันสำหรับรีเฟรชชื่อคอลัมน์เมื่อเปลี่ยนภาษา
  refreshHeaderNames() {
    this.columnDefs = this.generateColumnDefs();
    // ตรวจสอบว่ามี gridApi หรือยัง
    if (this.gridApi) {
      this.gridApi.setGridOption('columnDefs', this.columnDefs);
    } else {
      console.log('grid not work');
    }
  }
}
