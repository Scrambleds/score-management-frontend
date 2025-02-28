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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DashboardService } from '../../services/dashboard/dashboard.service';
import { ExcelExportService } from '../../services/excel-export/excel-export';
import { UserService } from '../../services/sharedService/userService/userService.service';
import {
  GridApi,
  GridOptions,
  GridReadyEvent,
  RowSelectedEvent,
} from 'ag-grid-community';
import { TranslationService } from '../../core/services/translation.service';
import { format } from 'date-fns';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard-admin',
  standalone: false,
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css'],
})
export class DashboardAdminComponent implements OnInit, OnChanges {
  @Input() tableData: any;
  @Input() SearchTriggered: boolean = false;
  @Input() reqtable: any;
  @Input() RequestTable: EventEmitter<any> = new EventEmitter();
  @Output() rowSelected = new EventEmitter<any>();
  form!: FormGroup;
  gridApi?: GridApi<any>;
  gridOptions: GridOptions;

  isRowSelected = false;
  pagination = true;
  paginationPageSize = 100;
  Data: any[] = [];
  columnDefs: any[] = [];
  isSearchTriggered = false;

  originalScoreType: any;

  defaultColDef = {
    resizable: true,
    sortable: true,
    filter: false,
    // checkboxSelection: (params: any) => params.node?.group !== true,
    // flex: 1,
  };

  constructor(
    private fb: FormBuilder,
    private dashboardService: DashboardService,
    private TranslationService: TranslationService,
    private UserService: UserService,
    private ExcelExportService: ExcelExportService
  ) {
    this.gridOptions = {
      columnDefs: this.generateColumnDefs(),
      defaultColDef: this.defaultColDef,
      rowSelection: {
        mode: 'multiRow',
        enableClickSelection: true,
        enableSelectionWithoutKeys: true,
      },
      selectionColumnDef: {
        sortable: true,
        pinned: 'left',
      },
      onRowSelected: this.onRowSelected.bind(this),
    };
  }

  onRowClicked(event: any) {
    if (!event.node) return;
    const isCurrentlySelected = event.node.isSelected();
    console.log('my Selected row: ', isCurrentlySelected);
    event.node.setSelected(!isCurrentlySelected, false);
  }

  // ฟังก์ชันแปลงจาก camelCase เป็น snake_case
  convertToSnakeCase(data: any): any {
    const convertedData: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        // แปลง key เป็น snake_case
        const snakeCaseKey = key
          .replace(/([a-z])([A-Z])/g, '$1_$2')
          .toLowerCase();
        convertedData[snakeCaseKey] = data[key];
      }
    }
    return convertedData;
  }

  // ฟังก์ชันสำหรับการ export ข้อมูลจากแถวที่เลือก
  exportExcel() {
    if (this.gridApi) {
      const selectedRows = this.gridApi.getSelectedRows();
      if (selectedRows.length === 0) {
        console.error('No rows selected.');
        return;
      }

      const requestData = selectedRows
        .map((row) => {
          return {
            subject_id: row.subjectId,
            subject_name: row.subjectName,
            academic_year: row.academicYear,
            semester: row.semester,
            section: row.section,
            score_type: this.reqtable?.score_type || 'คะแนนรวม',
            username: this.UserService.username,
          };
        })
        .map((row) => this.convertToSnakeCase(row));

      console.log('Request Data with username:', requestData);

      this.ExcelExportService.getBase64Excel(requestData).subscribe(
        (response) => {
          console.log('Full Response from API:', response);
          if (response && response.file) {
            const now = new Date();
            const base64Data = response.file;
            const formattedDate = format(now, 'yyyy-MM-dd');
            const formattedTime = format(now, 'HH-mm');

            let fileName = '';

            if (selectedRows.length === 1) {
              const row = selectedRows[0];
              fileName = `${row.subjectId}_${row.academicYear}_${row.semester}_${row.section}_${formattedDate}_${formattedTime}`;
            } else {
              fileName = `${
                this.reqtable?.score_type || 'คะแนนรวม'
              }_${formattedDate}_${formattedTime}`;
            }

            this.downloadExcel(base64Data, fileName);
          } else {
            console.error('No base64 data received or wrong response format');
          }
        },
        (error) => {
          console.error('Error exporting Excel:', error);
        }
      );
    }
  }

  // ฟังก์ชันดาวน์โหลดไฟล์ Excel
  downloadExcel(base64Data: string, fileName: string) {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: this.TranslationService.getTranslation(
        'swal_downloadTemplateSuccess_title'
      ),
      text: this.TranslationService.getTranslation(
        'swal_downloadTemplateSuccess_text'
      ),
      confirmButtonColor: '#0d6efd',
      confirmButtonText: this.TranslationService.getTranslation('btn_ok'),
    });
  }

  onCellClicked(event: any) {
    if (!event.node || event.column.getColId() === 'checkbox') return;

    setTimeout(() => {
      event.node.setSelected(!event.node.isSelected(), true);
      this.getSelectedRowData(); // ดึงข้อมูลแถวที่เลือก
    }, 50);

    setTimeout(() => {
      const isSelected = event.node.isSelected();
      event.node.setSelected(!isSelected, true); // Toggle สถานะ
    }, 50); // หน่วงเวลาเล็กน้อยให้ ag-Grid ประมวลผล
  }

  getSelectedRowData() {
    if (this.gridApi) {
      const selectedRows = this.gridApi.getSelectedRows();
      console.log('Selected Row Data:', selectedRows);
    }
    return [];
  }

  generateColumnDefs() {
    return [
      {
        headerName:
          this.TranslationService.getTranslation('user_manage_number') ||
          'เลขที่',
        valueGetter: 'node.rowIndex + 1',
        flex: 0.1,
        minWidth: 100,
        sortable: true,
        filter: false,
      },
      {
        headerName:
          this.TranslationService.getTranslation('subject_code') ||
          'รหัสรายวิชา',
        field: 'subjectId',
        flex: 0.8,
        minWidth: 70,
        sortable: true,
      },
      {
        headerName:
          this.TranslationService.getTranslation('subject_name') ||
          'ขื่อรายวิชา',
        field: 'subjectName',
        flex: 1,
        minWidth: 100,
        sortable: true,
      },
      {
        headerName:
          this.TranslationService.getTranslation('academic_year') ||
          'ปีการศึกษา',
        field: 'academicYear',
        flex: 0.6,
        minWidth: 100,
        sortable: true,
      },
      {
        headerName:
          this.TranslationService.getTranslation('semester') || 'ภาคเรียน',
        field: 'semester',
        flex: 0.6,
        minWidth: 100,
        sortable: true,
      },
      {
        headerName:
          this.TranslationService.getTranslation('section') || 'หมู่เรียน',
        field: 'section',
        flex: 0.6,
        minWidth: 100,
        sortable: true,
      },
      {
        headerName:
          this.TranslationService.getTranslation('dashboard_scoretype') ||
          'ประเภทคะแนน',
        field: 'scoreType',
        flex: 0.6,
        minWidth: 100,
        sortable: true,
      },
      {
        headerName:
          this.TranslationService.getTranslation('dashboard_number_student') ||
          'จำนวนนิสิต',
        field: 'studentCount',
        flex: 0.6,
        minWidth: 100,
        sortable: true,
      },
    ];
  }

  refreshHeaderNames() {
    this.columnDefs = this.generateColumnDefs();
    // ตรวจสอบว่ามี gridApi หรือยัง
    if (this.gridApi) {
      this.gridApi.setGridOption('columnDefs', this.columnDefs);
    } else {
      console.log('grid not work');
    }
  }

  onRowSelected(event: RowSelectedEvent<any>) {
    this.updateIsRowSelected();
    this.getSelectedRowData();
  }

  updateIsRowSelected() {
    const selectedRowsCount = this.gridApi!.getSelectedRows().length;
    this.isRowSelected = selectedRowsCount > 0;
    console.log('isSelectRow => ', this.isRowSelected);
  }

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

  loadTableData() {
    let requestData = { ...this.reqtable }; // สร้างสำเนาของ reqtable เพื่อไม่ให้แก้ไขโดยตรง
    const role = this.UserService.role;
    const username = this.UserService.username;
    const teachercode = this.UserService.teacherCode;

    requestData.teacher_code = role === 2 ? this.UserService.teacherCode : '';
    requestData.username = username; // เพิ่ม username ลงไปใน requestData

    this.dashboardService.getTableData(requestData).subscribe(
      (resp) => {
        this.isSearchTriggered = true;
        if (resp && resp.length > 0) {
          console.log('API Response:', resp);
          this.Data = resp.map((item) => ({
            ...item,
            scoreType: item.scoreType || 'คะแนนรวม',
          }));
        } else {
          console.error('Received empty response');
          this.Data = [];
        }
      },
      (error: any) => {
        console.error('API Error:', error);
        this.isSearchTriggered = true;
        if (error.status === 404) {
          console.warn('No data found, setting empty table.');
          this.Data = [];
        }
      }
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('ngOnChanges triggered:', changes);

    if (changes['reqtable'] && !changes['reqtable'].firstChange) {
      // Check if score_type has changed
      if (this.reqtable?.score_type !== this.originalScoreType) {
        this.isRowSelected = false; // Reset row selection state
        console.log('score_type changed, disabling export button');
      }
      this.originalScoreType = this.reqtable?.score_type || ''; // Update the original score_type
      this.loadTableData();
    }
  }

  ngOnInit() {
    this.originalScoreType = this.reqtable?.score_type || '';
    this.isSearchTriggered = false;
    const role = this.UserService.role;
    const teacher_code = this.UserService.teacherCode;
    // const username = this.UserService.username;

    console.log('POND', role);
    console.log('POND1', teacher_code);

    this.form = this.fb.group({
      subject_id: '',
      academic_year: '',
      semester: '',
      section: '',
      score_type: 'คะแนนรวม',
      // teacher_code: 'S2042',
    });

    this.RequestTable.subscribe((data) => {
      console.log('DATA FROM SEARCH:', data);
      this.reqtable = data || null; // ถ้า data เป็น null ก็รีเซ็ตค่า
      this.isSearchTriggered = true;
      this.loadTableData(); // โหลดข้อมูลใหม่
    });

    if (this.tableData.length > 0) {
      this.Data = [...this.tableData];
      console.log('Data from @Input tableData:', this.Data);
    } else {
      this.loadTableData(); // โหลดข้อมูลเมื่อไม่มีข้อมูล
    }

    this.TranslationService.getTranslations().subscribe(() => {
      console.log('change lang done!');
      this.refreshHeaderNames();
    });
  }
}
