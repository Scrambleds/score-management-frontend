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
import { ModalSendMailComponent } from '../../modal-send-mail/modal-send-mail.component';
import {
  GridApi,
  GridOptions,
  GridReadyEvent,
  RowSelectedEvent,
} from 'ag-grid-community';

@Component({
  selector: 'table-score-announcemen',
  standalone: false,

  templateUrl: './table-score-announcemen.component.html',
  styleUrl: './table-score-announcemen.component.css',
})
export class TableScoreAnnouncementComponent {
  @Input() gridData: any[] = [];
  @Input() currentSubject: any[] = [];

  @ViewChild(ModalSendMailComponent) modal?: ModalSendMailComponent;

  isRowSelected = false; // Boolean สำหรับตรวจสอบการเลือกแถว
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
      // headerStyle: { textAlign: 'center' },
      flex: 1,
    },
    {
      headerName: 'ชื่อ-นามสกุล',
      field: 'fullname',
      // headerStyle: { textAlign: 'center' },
      flex: 2,
      valueGetter: (params: any) =>
        `${params.data.prefix_desc_th} ${params.data.firstname} ${params.data.lastname}`,
    },
    { headerName: 'รหัสสาขา', field: 'major_code', flex: 1 },
    {
      headerName: 'อีเมล',
      field: 'email',
      // headerClass: 'text-center',
      flex: 1.5,
    },
    {
      headerName: 'คะแนนเก็บ',
      field: 'accumulated_score',
      // headerClass: 'text-center',
      flex: 1,
    },
    {
      headerName: 'คะแนนกลางภาค',
      field: 'midterm_score',
      // headerClass: 'text-center',
      flex: 1,
    },
    {
      headerName: 'คะแนนปลายภาค',
      field: 'final_score',
      // headerClass: 'text-center',
      flex: 1,
    },
    {
      headerName: 'รวมคะแนน',
      field: 'total_score',
      flex: 1,
      // headerClass: 'text-center',
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
      // headerClass: 'text-center',
      cellRenderer: (params: any) => {
        // ใช้ Template Element เพื่อสร้าง DOM จาก HTML String
        const template = `
          <div class="d-flex justify-content-center align-items-center" style="height: 100%;">
            <i class="bi bi-send" style="color: blue; font-size: 22px; cursor: pointer;" title="ส่งคะแนน"></i>
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

  defaultColDef = {
    resizable: true,
    sortable: true,
    filter: false,
  };

  gridOptions: GridOptions = {
    columnDefs: this.columnDefs,
    defaultColDef: this.defaultColDef,
    rowSelection: {
      mode: 'multiRow',
      enableClickSelection: true, // คลิกที่แถวเพื่อเลือก
      enableSelectionWithoutKeys: true, // เลือกหลายแถวโดยไม่ต้องกด Ctrl หรือ Shift
    },
    selectionColumnDef: {
      sortable: true,
      // resizable: true,
      // width: 300,
      // suppressHeaderMenuButton: true,
      pinned: 'left',
    },
    onRowSelected: this.onRowSelected.bind(this), // ผูกฟังก์ชันกับอีเวนต์ selectRow
    // suppressRowClickSelection: false, // เปิดให้คลิกแถวเพื่อเลือก
  };

  constructor(private scoreService: ScoreAnnouncementService) {}
  // @Input() gridData: any[] = [];
  // gridApi: any;
  gridApi!: GridApi<any>;

  // ใน ngOnInit หรือเมื่อ gridData ถูกอัปเดต
  ngOnChanges(): void {
    if (this.gridApi) {
      // this.gridApi.setRowData(this.gridData); // รีเฟรชข้อมูล
      this.gridApi.setGridOption('rowData', this.gridData);
    }
  }

  // onGridReady(params: any): void {
  //   this.gridApi = params.api;
  //   this.gridApi.sizeColumnsToFit();
  // }
  onGridReady(params: GridReadyEvent<any>) {
    this.gridApi = params.api;
    // this.gridApi.sizeColumnsToFit();
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
    const selectedRowsCount = this.gridApi.getSelectedRows().length;
    this.isRowSelected = selectedRowsCount > 0;
    console.log('isSelectRow => ', this.isRowSelected);
  }
}
