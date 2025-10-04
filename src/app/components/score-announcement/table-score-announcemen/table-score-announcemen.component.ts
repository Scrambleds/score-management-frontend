import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

// import { UploadScoreHeaderComponent } from '../table-score-announcemen.component';
import Swal from 'sweetalert2';
import { ModalSendMailComponent } from '../../modal-send-mail/modal-send-mail.component';
import {
  GridApi,
  GridOptions,
  GridReadyEvent,
  RowSelectedEvent,
} from 'ag-grid-community';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'table-score-announcemen',
  standalone: false,

  templateUrl: './table-score-announcemen.component.html',
  styleUrl: './table-score-announcemen.component.css',
})
export class TableScoreAnnouncementComponent implements OnInit, OnChanges {
  // @Input() gridData: any[] = [];
  @Input() gridData: any[] = [];
  @Input() currentSubject: any[] = [];
  @Output() emailStatusChanged = new EventEmitter<boolean>();
  gridApi?: GridApi<any>;
  @ViewChild(ModalSendMailComponent) modal?: ModalSendMailComponent;
  columnDefs: any[] = [];
  gridOptions?: GridOptions;
  isRowSelected = false; // Boolean สำหรับตรวจสอบการเลือกแถว
  pagination = true;
  paginationPageSize = 100;
  constructor(private translationService: TranslationService) {
    this.gridOptions = {
      columnDefs: this.columnDefs,
      defaultColDef: this.defaultColDef,
      rowSelection: {
        mode: 'multiRow',
        enableClickSelection: true, // คลิกที่แถวเพื่อเลือก
        enableSelectionWithoutKeys: true, // เลือกหลายแถวโดยไม่ต้องกด Ctrl หรือ Shift
      },
      selectionColumnDef: {
        sortable: true,
        pinned: 'left',
      },
      onRowSelected: this.onRowSelected.bind(this), // ผูกฟังก์ชันกับอีเวนต์ selectRow
      // suppressRowClickSelection: false, // เปิดให้คลิกแถวเพื่อเลือก
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    //check @Input() gridData: any[] = []; ถ้าค่าเปลี่ยนให้ทำการเรียกใช้โค้ดนี้
    if (changes['gridData']) {
      console.log('gridData changed:', changes['gridData'].currentValue);
      this.isRowSelected = false;
    }
  }

  ngOnInit(): void {
    // this.refreshHeaderNames(); // รีเฟรชชื่อคอลัมน์เมื่อเปลี่ยนภาษา

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
          ) || 'เลขที่',
        field: 'seat_no',
        flex: 0.6,
        minWidth: 70,
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
        flex: 1,
        minWidth: 120,
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
        flex: 2,
        valueGetter: (params: any) =>
          `${params.data.prefix_desc_th} ${params.data.firstname} ${params.data.lastname}`,
        minWidth: 200,
      },
      {
        headerName:
          this.translationService.getTranslation(
            'uploadscore_tableFieldMajor'
          ) || 'สาขา',
        field: 'major_code',
        flex: 0.6,
        minWidth: 70,
      },
      {
        headerName:
          this.translationService.getTranslation(
            'uploadscore_tableFieldEmail'
          ) || 'อีเมล',
        field: 'email',
        flex: 1.5,

        minWidth: 180,
      },
      {
        headerName:
          this.translationService.getTranslation(
            'uploadscore_tableFieldAccScore'
          ) || 'คะแนนระหว่างเรียน',
        field: 'accumulated_score',
        flex: 1,
        minWidth: 120,
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
        cellRenderer: (params: any) => {
          const value = params.value;
          return this.ScoreNullCellRenderer(value);
        },
        flex: 1,
        minWidth: 130,
      },
      {
        headerName:
          this.translationService.getTranslation(
            'uploadscore_tableFieldFinScore'
          ) || 'คะแนนปลายภาค',
        field: 'final_score',
        flex: 1,
        minWidth: 130,
        cellRenderer: (params: any) => {
          const value = params.value;
          return this.ScoreNullCellRenderer(value);
        },
      },
      {
        headerName:
          this.translationService.getTranslation('total_score') || 'รวมคะแนน',
        field: 'total_score',
        flex: 0.75,
        minWidth: 100,
        valueGetter: (params: any) =>
          params.data.accumulated_score +
          params.data.midterm_score +
          params.data.final_score,
      },
      {
        headerName: this.translationService.getTranslation('send_status') || 'สถานะส่งคะแนน',
        field: 'send_status_code_desc_th',
        flex: 1.1,
        minWidth: 80,
        cellRenderer: (params: any) => {
          const sendStatus = params.value || '';
          const sendDesc = params.data.send_desc || '';
          let backgroundColor = '';
          switch (sendStatus.toLowerCase()) {
            case 'สำเร็จ':
              backgroundColor = '#4caf50'; // สีเขียว
              break;
            case 'ยังไม่ดำเนินการ':
              backgroundColor = '#ff9800'; // สีส้ม
              break;
            case 'ไม่สำเร็จ':
              backgroundColor = '#f44336'; // สีแดง
              break;
            default:
              backgroundColor = '#e0e0e0'; // สีเทา
          }
          return `
            <div class="h-100" style="display: flex; align-items: center;">
              <div title="${sendDesc}" style="cursor: pointer; color: #ffffff; background: ${backgroundColor}" class="badge">
                ${sendStatus}
              </div>
            </div>
          `;
        },
      },

      {
        headerName:
          this.translationService.getTranslation('send_score_table_title') ||
          'ส่งคะแนน',
        flex: 0.8,
        filter: false,
        minWidth: 100,
        // headerClass: 'text-center',
        cellRenderer: (params: any) => {
          // ใช้ Template Element เพื่อสร้าง DOM จาก HTML String
          const template = `
          <div class="d-flex justify-content-center align-items-center" style="height: 100%;">
            <i class="bi bi-send" style="color: blue; font-size: 20px; cursor: pointer;" title="ส่งคะแนน"></i>
          </div>
        `;

          const wrapper = document.createElement('div'); // ใช้ wrapper ชั่วคราว
          wrapper.innerHTML = template.trim(); // trim() เพื่อกำจัดช่องว่างที่ไม่จำเป็น

          const div = wrapper.firstChild as HTMLElement;
          console.log('click on open modal from person');
          div.addEventListener('click', (event) => {
            event.stopPropagation(); // หยุดการแพร่กระจายของ event ไปยัง row
            console.log(params.data);
            params.openModal([params.data]);
          });

          return div;
        },
        // context: this,
        cellRendererParams: {
          openModal: this.open.bind(this), // ส่งฟังก์ชันจาก parent
        },
      },
    ];
    // if (this.gridApi) {
    //   this.gridApi.setGridOption('rowData', this.gridData);
    // }
  }

  defaultColDef = {
    resizable: true,
    sortable: true,
    filter: false,
  };
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

  //ไว้เรียกการทำงานครั้งแรกเซ็ต header แทนการกำหนด colDefs ตรงๆตอนเริ่ม
  onGridReady(params: GridReadyEvent<any>) {
    this.gridApi = params.api;
    if (this.gridApi) {
      console.log('gridReady api work');
      this.refreshHeaderNames();
    } else {
      console.log('gridReady api not work');
    }
    this.updateIsRowSelected();
  }

  sendMultiple() {
    if (!this.gridApi) {
      console.warn('Grid API is not ready.');
      return;
    }

    // ดึงข้อมูล rows ที่เลือกทั้งหมด
    const selectedRows = this.gridApi.getSelectedRows();

    if (selectedRows.length === 0) {
      Swal.fire('โปรดเลือกข้อมูลก่อนส่ง', '', 'warning');
      return;
    }
    console.log('Selected Rows: ', selectedRows);
    this.modal?.openModal(false, selectedRows, this.currentSubject);
  }
  sendAll() {
    if (!this.gridApi) {
      console.warn('Grid API is not ready.');
      return;
    }
    const allRows: any[] = [];
    // ดึงข้อมูล rows ที่เลือกทั้งหมด
    this.gridApi.forEachNode((node) => {
      if (node.data) {
        allRows.push(node.data);
      }
    });

    console.log('All Rows: ', allRows);
    this.modal?.openModal(false, allRows, this.currentSubject);
  }

  open(data: any[]): void {
    this.modal?.openModal(true, data, this.currentSubject);
    // this.modal?.isSendPerPerson = isPerson;
    // this.isSendPerPerson.emit(isPerson);
  }

  // อีเวนต์เมื่อมีการเลือกแถว
  onRowSelected(event: RowSelectedEvent<any>) {
    this.updateIsRowSelected();
  }

  // อัปเดตค่า isRowSelected
  updateIsRowSelected() {
    const selectedRowsCount = this.gridApi!.getSelectedRows().length;
    this.isRowSelected = selectedRowsCount > 0;
    console.log('isSelectRow => ', this.isRowSelected);
  }

  onChildEmailStatus(status: boolean) {
    // เมื่อได้รับ event จาก app-send-email ให้ส่งต่อไปยัง Parent
    if (status) {
      this.modal?.closeModal();
    }
    this.emailStatusChanged.emit(status);
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
