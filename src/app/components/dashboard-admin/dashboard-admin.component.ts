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
import { DashboardService } from '../../services/dashboard/dashboard.service';
import { ExcelExportService } from '../../services/excel-export/excel-export';
import {
  GridApi,
  GridOptions,
  GridReadyEvent,
  RowSelectedEvent,
} from 'ag-grid-community';
import { TranslationService } from '../../core/services/translation.service';
import { format } from 'date-fns';

@Component({
  selector: 'app-dashboard-admin',
  standalone: false,
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css']
})
export class DashboardAdminComponent implements OnInit {
  @Input() tableData: any[] = [];
  @Input() SearchTriggered: boolean = false;
  @Output() rowSelected = new EventEmitter<any>();
  gridApi?: GridApi<any>;
  gridOptions: GridOptions;

  isRowSelected = false;
  pagination = true;
  paginationPageSize = 100;
  Data: any[] = [];
  columnDefs: any[] = [];

  defaultColDef = {
    resizable: true,
    sortable: true,
    filter: false,
    // checkboxSelection: (params: any) => params.node?.group !== true,
    // flex: 1,
  };

  constructor(private dashboardService: DashboardService, private TranslationService: TranslationService
    ,private ExcelExportService: ExcelExportService,
  ) {
    this.gridOptions = {
      suppressRowClickSelection: false,
      suppressAggFuncInHeader: true,
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
      const snakeCaseKey = key.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
      convertedData[snakeCaseKey] = data[key];
    }
  }
  return convertedData;
}

// ฟังก์ชันสำหรับการ export ข้อมูลจากแถวที่เลือก
exportExcel() {
  if (this.gridApi) {
    // ดึงข้อมูลแถวที่เลือกจาก ag-Grid
    const selectedRows = this.gridApi.getSelectedRows();
    if (selectedRows.length === 0) {
      console.error("No rows selected.");
      return;  // ถ้าไม่มีแถวที่เลือก ไม่ส่ง Request
    }

    // แปลงข้อมูลแถวที่เลือกเป็น snake_case
    const requestData = selectedRows.map(row => {
      return {
        subject_id: row.subjectId,
        subject_name: row.subjectName,
        academic_year: row.academicYear,
        semester: row.semester,
        section: row.section,
        score_type: 'คะแนนรวม',
      };
    }).map(row => this.convertToSnakeCase(row));  // แปลงเป็น snake_case

    console.log('Request Data in snake_case:', requestData);  // ตรวจสอบข้อมูลที่แปลงแล้ว

    this.ExcelExportService.getBase64Excel(requestData).subscribe(
      (response) => {
        console.log('Full Response from API:', response);  // Log the full response
        if (response && response.file) {
          const base64Data = response.file;
          this.downloadExcel(base64Data, 'test');
        } else {
          console.error("No base64 data received or wrong response format");
        }
      },
      (error) => {
        console.error("Error exporting Excel:", error);
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

  ngOnChanges(changes: SimpleChanges): void {
    //check @Input() gridData: any[] = [];
    if (changes['gridData']) {
      console.log('gridData changed:', changes['gridData'].currentValue);
      this.isRowSelected = false;
    }
  }

  getSelectedRowData() {
    if (this.gridApi) {
      const selectedRows = this.gridApi.getSelectedRows();
      console.log("Selected Row Data:", selectedRows);
    }
    return [];
  }  

  // sendSelectedRowsToApi() {
  //   const selectedRows = this.getSelectedRowData();
  //   if (selectedRows.length === 0) {
  //     console.warn("No rows selected.");
  //     return;
  //   }
  
  //   const requestData = {
  //     score_type: "คะแนนรวม",
  //     selectedData: selectedRows,
  //   };
  
  //   this.ExcelExportService.getBase64Excel(requestData).subscribe(
  //     (response) => {
  //       if (response && response.file) {
  //         const fileName = "SelectedRowsReport";
  //         this.downloadExcel(response.file, fileName);
  //       } else {
  //         console.error("No base64 data received");
  //       }
  //     },
  //     (error) => {
  //       console.error("Error exporting Excel:", error);
  //     }
  //   );
  // }  

  generateColumnDefs() {
    return [
      {
        headerCheckboxSelection: true,
        checkboxSelection: true,
        flex: 0.1,
        minWidth: 55,
      },
      {
        headerName:
          this.TranslationService.getTranslation(
            'uploadscore_tableFieldSeatNo'
          ) || 'เลขที่',
        valueGetter: 'node.rowIndex + 1',
        flex: 0.1,
        minWidth: 100,
        sortable: true,
        filter: false
      },
      {
        headerName: 'รหัสวิชา',
        field: 'subjectId',
        flex: 0.8,
        minWidth: 70,
        sortable: true,
      },
      {
        headerName: 'ชื่อวิชา',
        field: 'subjectName',
        flex: 1,
        minWidth: 100,
        sortable: true,
      },
      {
        headerName: 'ปีการศึกษา',
        field: 'academicYear',
        flex: 0.6,
        minWidth: 100,
        sortable: true,
      },
      {
        headerName: 'ภาคการศึกษา',
        field: 'semester',
        flex: 0.6,
        minWidth: 100,
        sortable: true,
      },
      {
        headerName: 'หมู่เรียน',
        field: 'section',
        flex: 0.6,
        minWidth: 100,
        sortable: true,
      },
      {
        headerName: 'ประเภทคะแนน',
        field: 'scoreType',
        flex: 0.6,
        minWidth: 100,
        sortable: true,
      },
      {
        headerName: 'จำนวนนิสิต',
        field: 'studentCount',
        flex: 0.6,
        minWidth: 100,
        sortable: true,
      }
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


  ngOnInit() {
    console.log('ACTIVATE ngOnInit');

    if (this.tableData.length > 0) {
      this.Data = [...this.tableData];
      console.log('Data from @Input tableData:', this.Data);
    }

    if (this.Data.length === 0) {
      this.dashboardService.getTableData({}).subscribe(
        (resp) => {
          if (resp) {
            console.log("API Response:", resp);
            this.Data = resp;
          } else {
            console.error("Received empty response");
          }
        },
        (error: any) => {
          console.error("API Error:", error);
        }
      );

      this.TranslationService.getTranslations().subscribe(() => {
        console.log('change lang done!');
        console.log(
          this.TranslationService.getTranslation('uploadscore_tableFieldSeatNo')
        );

        this.refreshHeaderNames();
      });
    }
  }
}