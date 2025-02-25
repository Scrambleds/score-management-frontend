import {
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { DashboardService } from '../../services/dashboard/dashboard.service';
import {
  GridApi,
  GridOptions,
  GridReadyEvent,
  RowSelectedEvent,
  FirstDataRenderedEvent
} from 'ag-grid-community';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-dashboard-admin',
  standalone: false,
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css']
})
export class DashboardAdminComponent implements OnInit {
  @Input() tableData: any[] = [];
  @Input() SearchTriggered: boolean = false;
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
    // flex: 1,
  };

  constructor(private dashboardService: DashboardService, private TranslationService: TranslationService) {
    this.gridOptions = {
      suppressRowClickSelection: true, 
      suppressAggFuncInHeader: true,
      columnDefs: this.generateColumnDefs(),
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
      onRowSelected: this.onRowSelected.bind(this),
      onGridReady: this.onGridReady.bind(this),
    };
  }
  
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
  }

  updateIsRowSelected() {
    if (this.gridApi) {
      this.isRowSelected = this.gridApi.getSelectedNodes().length > 0;
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    console.log('Grid is ready');
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