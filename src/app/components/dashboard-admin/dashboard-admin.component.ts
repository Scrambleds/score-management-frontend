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
    // checkboxSelection: (params: any) => params.node?.group !== true,
    // flex: 1,
  };

  constructor(private dashboardService: DashboardService, private TranslationService: TranslationService) {
    this.gridOptions = {
      suppressRowClickSelection: false, // อนุญาตให้เลือกแถวโดยคลิกที่ใดก็ได้
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
      onRowSelected: this.onRowSelected.bind(this), // ผูกฟังก์ชันกับอีเวนต์ selectRow
    };
  }

  onRowClicked(event: any) {
    if (!event.node) return;
    const isCurrentlySelected = event.node.isSelected();
    event.node.setSelected(!isCurrentlySelected, false); // Toggle สถานะ
  }

  onCellClicked(event: any) {
    if (!event.node || event.column.getColId() === 'checkbox') {
      return; // ไม่ทำอะไรถ้าคลิกที่ checkbox โดยตรง
    }
  
    setTimeout(() => {
      const isSelected = event.node.isSelected();
      event.node.setSelected(!isSelected, true); // Toggle สถานะ
    }, 50); // หน่วงเวลาเล็กน้อยให้ ag-Grid ประมวลผล
  }  

  ngOnChanges(changes: SimpleChanges): void {
    //check @Input() gridData: any[] = []; ถ้าค่าเปลี่ยนให้ทำการเรียกใช้โค้ดนี้
    if (changes['gridData']) {
      console.log('gridData changed:', changes['gridData'].currentValue);
      this.isRowSelected = false;
    }
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