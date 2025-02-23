import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  OnInit,
  viewChild,
} from '@angular/core';
import * as XLSX from 'xlsx';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SearchService } from '../../services/search-service/seach.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AddUserService } from '../../services/add-user/add-user.service';
import { UserService } from '../../services/sharedService/userService/userService.service';
import { masterDataService } from '../../services/sharedService/masterDataService/masterDataService';
import { SelectBoxService } from '../../services/select-box/select-box.service';
import { forkJoin } from 'rxjs';
import { EditUserComponent } from '../edit-user/edit-user.component';
// import { RowNode } from 'ag-grid-community';
import { GridApi, GridOptions, RowNode } from 'ag-grid-community';
import { TranslationService } from '../../core/services/translation.service';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CacheService } from '../../core/services/cache.service';

@Component({
  selector: 'app-add-user',
  standalone: false,
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css'],
})
export class AddUserComponent implements OnInit {
  gridApi!: GridApi;
  gridColumnApi: any;

  // @ViewChild('onReset', { static: false }) editUserComponent!: EditUserComponent;
  @ViewChild('editUserComponent', { static: false })
  editUserComponent!: EditUserComponent;
  gridOptions: GridOptions = {
    // domLayout: 'autoHeight',
    // pagination: true,
    // paginationPageSize: 10,
    // suppressRowClickSelection: true
  };
  roleData: any[] = [];
  prefixData: any[] = [];
  statusData: any[] = [];
  // onReset!: EditUserComponent;
  @Input() criteria: any;
  // @Input() titleName: string = 'อัปโหลดไฟล์ข้อมูลบัญชีผู้ใช้';
  // @Input() buttonName: string = 'อัปโหลดไฟล์ Excel';

  @Output() dataUploaded = new EventEmitter<any[]>(); // ส่งข้อมูลไปยัง Parent Component
  @Output() submitRequest = new EventEmitter<void>();
  @Output() isUploaded = new EventEmitter<boolean>();
  @Output() searchEvent = new EventEmitter<void>();

  searchCriteria: any;
  rowData: any[] = [];
  columnDefs: any[] = [];
  // columnDef: any[] = [];
  originalData: any[] = [];
  filteredData: any[] = [];
  isFileUploaded = false;
  translations: any;
  requiredFields = [
    'email', // ถ้าไม่จำเป็นสามารถเอาออกได้
    'teacher_code',
    'prefix',
    'firstname',
    'lastname',
    'role',
  ];

  defaultColDef = {
    sortable: true,
    resizable: true,
    editable: true,
  };

  form: FormGroup; // Declare form

  constructor(
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder,
    private searchService: SearchService,
    private addUserService: AddUserService,
    private UserService: UserService,
    private masterDataService: masterDataService,
    private SelectBoxService: SelectBoxService,
    private translate: TranslationService,
    private CacheService: CacheService,
  ) {
    this.form = this.fb.group({});
  }

  translateDropdown(value: string): string {
    return this.translations[value] || value;
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
  }

  initGrid() {
    this.columnDefs = Object.keys(this.originalData[0]).map((key) => ({
      field: key,
      headerName: key,
      sortable: true,
      filter: true,
    }));
  }

  onSomeAction() {
    if (this.editUserComponent) {
      // เรียกใช้เมธอดใน EditUserComponent
      this.editUserComponent.onReset();
      console.log('Method in EditUserComponent called!');
    }
  }

  LoadPrefix = () => {
    this.SelectBoxService.getSystemParamPrefix;
  };

  LoadRole = () => {
    this.SelectBoxService.getSystemParamRole;
  };

  onLoading = (): void => {
    this.onSomeAction();
    console.log('On change!');
  };

   // เมื่อไฟล์ถูกวางลง
    onDrop(event: DragEvent) {
      event.preventDefault();
      const file = event.dataTransfer?.files[0];
      if (file) {
        this.validateFile(file)
          .then((isValid) => {
            if (isValid) {
              this.processFile(file);
            }
          })
          .catch(() => {
            // หากการตรวจสอบไม่ผ่าน จะไม่ทำอะไร
          });
      }
    }
  
    // เมื่อเลือกไฟล์จาก input
    onFileSelected(event: any) {
      const file = event.target.files[0];
      if (file) {
        this.validateFile(file)
          .then((isValid) => {
            if (isValid) {
              this.processFile(file);
            }
          })
          .catch(() => {
            // หากการตรวจสอบไม่ผ่าน จะไม่ทำอะไร
          });
      }
    }
  
    // ฟังก์ชันตรวจสอบประเภทไฟล์
    validateFile(file: File): Promise<boolean> {
      const allowedExtensions = ['.xlsx', '.xls'];
      const allowedMimeTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
      ];
  
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const isValidExtension =
        fileExtension && allowedExtensions.includes(`.${fileExtension}`);
      const isValidMimeType = allowedMimeTypes.includes(file.type);
  
      if (!isValidExtension || !isValidMimeType) {
        return this.showError(
          `File Validation Error: ${file.name} is not a valid Excel file. Extension: ${fileExtension}, MIME Type: ${file.type}`
        );
      }
  
      return this.checkMagicNumber(file);
    }
  
    // ฟังก์ชันตรวจสอบ Magic Number (File Signature)
    checkMagicNumber(file: File): Promise<boolean> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const data = new Uint8Array(e.target.result);
          const magicNumberXlsx = [0x50, 0x4b, 0x03, 0x04]; // .xlsx เป็น ZIP ไฟล์
          const magicNumberXls = [0xd0, 0xcf, 0x11, 0xe0]; // .xls เป็น OLE compound
  
          // ตรวจสอบ Magic Number สำหรับ .xlsx
          if (file.name.toLowerCase().endsWith('.xlsx')) {
            if (
              !data
                .slice(0, 4)
                .every((byte, index) => byte === magicNumberXlsx[index])
            ) {
              return reject(
                this.showError(
                  `Magic Number Mismatch: ${file.name} is not a valid .xlsx file.`
                )
              );
            }
          }
  
          // ตรวจสอบ Magic Number สำหรับ .xls
          if (file.name.toLowerCase().endsWith('.xls')) {
            if (
              !data
                .slice(0, 4)
                .every((byte, index) => byte === magicNumberXls[index])
            ) {
              return reject(
                this.showError(
                  `Magic Number Mismatch: ${file.name} is not a valid .xls file.`
                )
              );
            }
          }
  
          resolve(true); // คืนค่า resolve เมื่อผ่านการตรวจสอบ
        };
  
        reader.onerror = () => {
          reject(
            this.showError(`File Read Error: Unable to read file ${file.name}`)
          );
        };
  
        reader.readAsArrayBuffer(file); // อ่านไฟล์
      });
    }
  
    // ฟังก์ชันสำหรับแสดงการแจ้งเตือน
    showError(
      logMessage: string,
      title: string = this.translate.getTranslation(
        'swal_FileTypeInvalid_title'
      ),
      text: string = this.translate.getTranslation(
        'swal_FileTypeInvalid_text'
      )
    ): Promise<boolean> {
      console.error(logMessage); // แสดงรายละเอียดข้อผิดพลาดใน log
      return Swal.fire({
        icon: 'error',
        title: title,
        text: text,
        confirmButtonColor: 'var(--secondary-color)',
        confirmButtonText: this.translate.getTranslation('btn_close'),
      }).then(() => false); // คืนค่าผลลัพธ์เป็น false หลังจากที่ Swal เสร็จสิ้น
    }

  ngOnInit() {
    const role = 'role';
    const prefix = 'prefix';
    const status = 'active_status';

    this.translate.getTranslations().subscribe((translations) => {
      this.translations = translations; // เก็บคำแปลไว้
      this.loadGridData(this.originalData); // สร้าง columnDefs เมื่อคำแปลโหลดเสร็จ
    });

    // this.LoadPrefix();
    // this.LoadRole();

    forkJoin({
      roleData: this.SelectBoxService.getSystemParamRole(role),
      prefixData: this.SelectBoxService.getSystemParamPrefix(prefix),
      statusData: this.SelectBoxService.getSystemParamStatus(status),
    }).subscribe({
      next: (results: any) => {
        console.log('Received role data: ', results.roleData);
        console.log('Received prefix data: ', results.prefixData);
        console.log('Received status data: ', results.statusData);

        // เก็บข้อมูลที่ได้รับจาก API ลงในตัวแปรที่แตกต่างกัน
        if (results.roleData && results.roleData.objectResponse) {
          this.roleData = results.roleData.objectResponse.filter(
            (item: any) => item.byte_code && item.byte_desc_th
          );
        }

        if (results.prefixData && results.prefixData.objectResponse) {
          this.prefixData = results.prefixData.objectResponse.filter(
            (item: any) => item.byte_code && item.byte_desc_th
          );
        }

        if (results.statusData && results.statusData.objectResponse) {
          this.statusData = results.statusData.objectResponse.filter(
            (item: any) => item.byte_code && item.byte_desc_en
          );
        }

        this.masterDataService.setMasterData(
          this.roleData,
          this.prefixData,
          this.statusData
        );
      },
      error: (err: any) => {
        console.log('Error fetching master data: ', err);
      },
    });

    this.masterDataService.getRoleDataObservable().subscribe((data) => {
      this.roleData = data;
    });

    this.masterDataService.getPrefixDataObservable().subscribe((data) => {
      this.prefixData = data;
    });

    this.searchService.currentSearchCriteria.subscribe((criteria) => {
      console.log('Updated criteria:', criteria);
      console.log('Original criteria:', this.originalData);
      if (criteria) {
        this.searchCriteria = criteria;
        this.filteredData = this.filterData(this.originalData, criteria);
        this.rowData = [...this.filteredData]; // อัปเดตข้อมูลใน ag-Grid
      }
    });

    this.translate.getTranslations().subscribe(() => {
      this.refreshHeaderNames(); // รีเฟรชชื่อคอลัมน์เมื่อเปลี่ยนภาษา
    });
  }

  ngOnChanges(): void {
    if (this.criteria) {
      console.log('Criteria updated:', this.criteria);
      // กรองข้อมูลใหม่ทุกครั้งที่ criteria เปลี่ยน
      this.filteredData = this.filterData(this.originalData, this.criteria);
      this.rowData = [...this.filteredData]; // อัปเดตข้อมูลใน ag-Grid
    } else {
      // ถ้าไม่มี criteria หรือเป็นค่าว่าง ให้แสดงข้อมูลทั้งหมด
      this.filteredData = [...this.originalData];
      this.rowData = [...this.originalData];
    }
  }

  updateCriteria(newCriteria: any): void {
    this.criteria = newCriteria;
    // กรองข้อมูลตาม criteria ใหม่
    this.filteredData = this.filterData(this.originalData, this.criteria);
    this.rowData = [...this.filteredData]; // อัปเดตข้อมูลใน ag-Grid
  }

  // ฟังก์ชันกรองข้อมูล
  filterData(data: any[], criteria: any): any[] {
    console.log('Data being filtered:', data);
    console.log('Filtering criteria:', criteria);

    // หาก criteria เป็นค่าว่างทั้งหมดยังไม่ทำการกรอง
    if (
      !criteria.teacher_code &&
      !criteria.fullname &&
      !criteria.email &&
      !criteria.role
      // !criteria.active_status
    ) {
      return data;
    }

    return data.filter((item) => {
      const fullname = `${item['prefix'] || ''} ${item['firstname'] || ''} ${
        item['lastname'] || ''
      }`.toLowerCase();

      const isMatching =
        (!criteria.teacher_code ||
          item['teacher_code']
            ?.toLowerCase()
            .includes(criteria.teacher_code?.toLowerCase())) &&
        (!criteria.email ||
          item['email']
            ?.toLowerCase()
            .includes(criteria.email?.toLowerCase())) &&
        (!criteria.role || item['role'] === criteria.role) &&
        (!criteria.fullname ||
          fullname.includes(criteria.fullname?.toLowerCase()));

      return isMatching;
    });
  }

  matchAnyField(searchString: string, item: any): boolean {
    const lowerCaseSearchString = searchString.toLowerCase();

    const fullName =
      `${item.prefix} ${item.firstname} ${item.lastname}`.toLowerCase();
    return fullName.includes(lowerCaseSearchString);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  // processFile(file: File) {
  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onload = (e: any) => {
  //       const data = new Uint8Array(e.target.result);
  //       const workbook = XLSX.read(data, { type: 'array' });

  //       const sheetName = workbook.SheetNames[0];
  //       const sheet = workbook.Sheets[sheetName];
  //       // ใช้ header: 1 เพื่อให้แถวแรกเป็น header
  //       const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  //       console.log("MY JSON", jsonData); // ตรวจสอบข้อมูลที่ได้

  //       const mappedData = this.mapJsonData(jsonData);
  //       // if (this.validateFields(jsonData)) {
  //       console.log('MAPDATA: ', mappedData);
  //       const modifiedData = this.processData(mappedData);
  //       console.log('modifiedData: ', modifiedData);
  //       this.loadGridData(modifiedData); // โหลดข้อมูลลงใน ag-Grid
  //       // this.rowData = [];
  //       // this.originalData = [];

  //       // this.generateColumnDefs(modifiedData);
  //       this.isFileUploaded = true;
  //       this.isUploaded.emit(true);
  //       // }
  //     };
  //     reader.readAsArrayBuffer(file);
  //   }
  // }

  processFile(file: File) {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
  
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // ใช้ header: 1 เพื่อให้แถวแรกเป็น header
        const jsonData: (string | null)[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
        // กรองแถวที่มีข้อมูลในคอลัมน์ที่ต้องการ (หน้าที่, รหัสอาจารย์, คำนำหน้า, ชื่อ, นามสกุล, อีเมล)
        const filteredData = jsonData.filter((row) => {
          // ตรวจสอบว่าแถวมีข้อมูลในคอลัมน์ที่สำคัญ
          return row[0] && row[1] && row[2] && row[3] && row[4] && row[5]; 
        });
  
        console.log("Filtered JSON", filteredData); // ตรวจสอบข้อมูลที่กรองแล้ว
  
        const mappedData = this.mapJsonData(filteredData);
        console.log('MAPDATA: ', mappedData);
        
        const modifiedData = this.processData(mappedData);
        console.log('modifiedData: ', modifiedData);
        this.loadGridData(modifiedData); // โหลดข้อมูลลงใน ag-Grid
  
        this.isFileUploaded = true;
        this.isUploaded.emit(true);
      };
      reader.readAsArrayBuffer(file);
    }
  }
  
  
  mapJsonData(data: any[]): any[] {
    const headers = data[0]; // ใช้แถวแรกเป็น header
    const rows = data.slice(1); // ใช้แถวที่เหลือเป็นข้อมูลจริง

    return rows.map((row, index) => {
      // สร้างอ็อบเจ็กต์โดยจับคู่ชื่อฟิลด์จาก headers กับข้อมูลในแถว
      const rowData: any = {};

      headers.forEach((header: string, index: number) => {
        rowData[header] = row[index]; // ค่าของแต่ละคอลัมน์
      });

      // คืนค่าข้อมูลในรูปแบบที่ต้องการ
      return {
        row_id: index,
        email: rowData['อีเมล'] || rowData['email'] || null,
        teacher_code: rowData['รหัสอาจารย์'] || rowData['teacher_code'] || null,
        prefix: rowData['คำนำหน้า'] || rowData['prefix'] || null,
        firstname: rowData['ชื่อ'] || rowData['firstname'] || null,
        lastname: rowData['นามสกุล'] || rowData['lastname'] || null,
        role: rowData['หน้าที่'] || rowData['role'] || null,
      };
    });
  }

  processData(data: any[]): any[] {
    return data.map((row, index) => {
      // จัดเรียงข้อมูลตามลำดับที่กำหนด
      return {
        row_id: index + 1,
        email: row['อีเมล'] || row['email'] || null,
        teacher_code: row['รหัสอาจารย์'] || row['teacher_code'] || null,
        prefix: row['คำนำหน้า'] || row['prefix'] || null,
        firstname: row['ชื่อ'] || row['firstname'] || null,
        lastname: row['นามสกุล'] || row['lastname'] || null,
        role: row['หน้าที่'] || row['role'] || null,
        manage: null,
      };
    });
  }

  loadGridData(data: any[]) {
    if (data.length > 0) {
      console.log("Mydata", data);
      this.rowData = data;
      this.originalData = data;
      this.columnDefs = this.generateColumnDefs(data);
      console.log('LOAD DATA: ', this.rowData);
    }
  }

  // ฟังก์ชันสำหรับรีเฟรชชื่อคอลัมน์เมื่อเปลี่ยนภาษา
  refreshHeaderNames() {
    if (this.originalData && this.originalData.length > 0) {
      this.columnDefs = this.generateColumnDefs(this.originalData);
    }
  }

  generateColumnDefs(data: any[]) {
    console.log('GENERATE COLUMN', data);
    if (data.length === 0) {
      return [];
    }

    return [
      ...Object.keys(data[0]).map((key) => {
        let customWidth = 100;
        let flexValue = 1;
        let cellClass = '';
        let fieldNameKey = '';

        switch (key) {
          case 'row_id':
            fieldNameKey = 'uploadscore_tableFieldSeatNo';
            customWidth = 70;
            flexValue = 0.3;
            break;
          case 'email':
            fieldNameKey = 'user_manage_email';
            customWidth = 70;
            flexValue = 1.7;
            break;
          case 'teacher_code':
            fieldNameKey = 'user_manage_teachercode';
            customWidth = 70;
            flexValue = 0.8;
            break;
          case 'prefix':
            fieldNameKey = 'user_manage_prefix';
            customWidth = 70;
            flexValue = 0.6;
            cellClass = 'agSelectCellEditor';
            break;
          case 'firstname':
            fieldNameKey = 'user_manage_name';
            customWidth = 70;
            flexValue = 1.2;
            break;
          case 'lastname':
            fieldNameKey = 'user_manage_surname';
            customWidth = 70;
            flexValue = 1.2;
            break;
          case 'role':
            fieldNameKey = 'user_manage_role';
            customWidth = 70;
            flexValue = 0.8;
            cellClass = 'text-end';
            cellClass = 'agSelectCellEditor';
            break;
          case 'manage':
            return {
              headerName: '',
              field: 'action',
              width: 100,
              cellRenderer: (params: any) => {
                const rowId = params.data.row_id;

                // Create container for delete button
                const container = document.createElement('div');
                container.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
                  <button style="background: none; border: none; cursor: pointer; display: flex; justify-content: center; align-items: center;">
                    <i class="bi bi-trash3" style="color: #d33; font-size: 1.2rem;"></i>
                  </button>
                </div>
              `;

                // Add event listener for delete
                container
                  .querySelector('button')
                  ?.addEventListener('click', () => {
                    this.onDeleteRow(rowId); // Pass row_id to onDeleteRow method
                  });

                return container;
              },
              suppressHeaderMenuButton: true,
            };
          default:
            customWidth = 160;
            fieldNameKey = key;
        }

        const translatedHeader = this.translate.getTranslation(fieldNameKey);

        return {
          field: key,
          headerName: translatedHeader || key,
          flex: flexValue,
          minWidth: customWidth,
          cellClass: cellClass,
          cellRenderer: (params: any) => this.customCellRenderer(params.value),
          valueFormatter:
            key === 'prefix' || key === 'role'
              ? (params: any) => this.translateDropdown(params.value)
              : undefined,
          cellEditorParams: {
            values:
              key === 'prefix'
                ? this.prefixData.map((item) =>
                    this.translateDropdown(item.byte_desc_th)
                  )
                : key === 'role'
                ? this.roleData.map((item) =>
                    this.translateDropdown(item.byte_desc_th)
                  )
                : [],
          },
          cellEditor:
            key === 'prefix' || key === 'role'
              ? 'agSelectCellEditor'
              : undefined,
        };
      }),
    ];
  }

  private customCellRenderer(value: any): string {
    if (
      value === null ||
      value === undefined ||
      value.toString().trim() === ''
    ) {
      return `<span style="color: red; font-weight: bold; background-color: #ffcccc; padding: 2px 5px; border-radius: 3px;">NULL</span>`;
    } else if (value === '-') {
      return `<span style="color: red; font-weight: bold;">-</span>`;
    }
    return value;
  }

  onDeleteRow(rowId: number) {
    const title = this.translate.getTranslation('add_user_question_1');
    const text = this.translate.getTranslation('add_user_question_2');
    const delete_button = this.translate.getTranslation('add_user_delete');
    const cancel_button = this.translate.getTranslation('btn_cancel');

    console.log(this.originalData);
    const rowIndex = this.originalData.findIndex((row) => row.row_id === rowId);
    console.log(rowIndex);
    console.log(rowId);
    if (rowIndex !== -1) {
      Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: delete_button,
        cancelButtonText: cancel_button,
      }).then((result) => {
        if (result.isConfirmed) {
          if (this.gridApi) {
            this.originalData.splice(rowIndex, 1);

            //รีเซ็ตค่า row_id สำหรับแถวที่เหลือ
            this.originalData.forEach((row, index) => {
              row.row_id = index + 1;
            });

            this.gridApi.applyTransaction({
              remove: this.originalData.filter(
                (row) => row.row_id === rowIndex
              ),
            });
            
            this.rowData = [...this.originalData];
            this.gridApi.setGridOption('rowData', this.rowData);
            this.gridApi.refreshCells({ force: true });
          }

          console.log('Row rowData', this.rowData);
          console.log('Row originalData', this.originalData);
          console.log('Row deleted successfully.');
        } else {
          console.log('Row deletion canceled');
        }
      });
    } else {
      console.log('Row not found to delete.');
    }
  }

  // onSaveData() {
  //   const currentLang = localStorage.getItem('language') || 'en';

  //   // ตรวจสอบว่ามีข้อมูลในตารางหรือไม่
  //   if (!this.rowData || this.rowData.length === 0) {
  //     Swal.fire({
  //       title: currentLang === 'th' ? 'ไม่มีข้อมูล' : 'No data',
  //       text:
  //         currentLang === 'th'
  //           ? 'กรุณาอัปโหลดข้อมูลก่อนบันทึก'
  //           : 'Please upload data before saving',
  //       icon: 'error',
  //       confirmButtonText: currentLang === 'th' ? 'ตกลง' : 'OK',
  //     });
  //     return;
  //   }

  // // ตรวจสอบฟิลด์ที่ว่างเปล่าในแต่ละแถว
  // const missingFieldsGrouped = this.rowData
  // .map((row, index) => {
  //   const missingFields = this.requiredFields.filter((field) => {
  //     // ตรวจสอบว่าฟิลด์มีอยู่จริงในแถวนี้หรือไม่
  //     if (!row.hasOwnProperty(field)) {
  //       return true;
  //     }
      
  //     const value = row[field]; // ดึงค่าของฟิลด์นั้นๆ
  //     // ตรวจสอบว่า value เป็น null, undefined, ค่าว่าง หรือ 'NULL'
  //     return !value || value.toString().trim() === '' || value.toString().trim().toUpperCase() === 'NULL';
  //   });

  //   return missingFields.length > 0
  //     ? `${currentLang === 'th' ? 'แถวที่' : 'Row'} ${index + 1}: ${missingFields.join(', ')}`
  //     : null;
  // })
  // .filter((item) => item !== null);

  // // หากมีฟิลด์ที่ว่างเปล่า แสดงการแจ้งเตือน
  // if (missingFieldsGrouped.length > 0) {
  // console.log(this.rowData);  // แสดงข้อมูลใน console เพื่อดูค่า
  // Swal.fire({
  //   title: currentLang === 'th' ? 'ข้อมูลไม่ครบถ้วน' : 'Incomplete Data',
  //   html: `${
  //     currentLang === 'th' ? 'พบฟิลด์ที่ยังไม่ได้กรอก:' : 'Missing fields:'
  //   }<br>${missingFieldsGrouped.join('<br>')}`,
  //   icon: 'warning',
  //   confirmButtonColor: '#0d6efd',
  //   confirmButtonText: currentLang === 'th' ? 'ตกลง' : 'OK',
  // });
  // return;
  // }

  //   const UserInfo = this.UserService.username;

  //   // กำหนดข้อมูลที่ต้องการส่ง
  //   const dataToSend = this.rowData.map((row) => {
  //     const { create_date, ...filteredRow } = row;
  //     return {
  //       ...filteredRow,
  //       create_by: UserInfo,
  //     };
  //   });

  //   const Success_title = this.translate.getTranslation('sweet_alert_success');
  //   const Success_text = this.translate.getTranslation('sweet_alert_edit');
  //   const Submit_Button = this.translate.getTranslation('btn_ok');
  //   const Fail_title = this.translate.getTranslation('sweet_alert_fail_title');
  //   const Fail_text = this.translate.getTranslation('sweet_alert_fail_text');
  //   const email_duplicated = this.translate.getTranslation('email_duplicated');
  //   const teacherCode_duplicated = this.translate.getTranslation(
  //     'add_user_duplicated_teachercode'
  //   );

  //   // ส่งข้อมูลไปยัง API
  //   this.addUserService.insertUser(dataToSend).subscribe(
  //     (response) => {
  //       Swal.fire({
  //         title: Success_title,
  //         text: Success_text,
  //         icon: 'success',
  //         confirmButtonColor: '#0d6efd',
  //         confirmButtonText: Submit_Button,
  //       }).then(() => {
  //         this.CacheService.clearCacheForUrl(
  //           '/api/EditUser/GetAllUser'
  //         );
  //         this.router.navigate(['/UserManagement']);
  //       });
  //     },
  //     (error) => {
  //       console.error('Error occurred while inserting user data: ', error);

  //       if (error && error.errors) {
  //         const errorMessages = error.errors;
  //         const errorMessage_code = error.message;

  //         if (
  //           errorMessages.length > 0 &&
  //           errorMessage_code == 'มีอีเมลบางรายการที่ใช้งานแล้ว'
  //         ) {
  //           console.log(errorMessages);
  //           console.log('My error email: ', errorMessage_code);
  //           // const errorMessage = errorMessages
  //           // .map((err: { th: string; en: string }) => (err as { [key: string]: string })[currentLang])
  //           //   .join('<br>');
  //           const duplicatedEmail = errorMessages.join('<br>');

  //           Swal.fire({
  //             title: Fail_title,
  //             html: `${email_duplicated}<br>${duplicatedEmail}`,
  //             icon: 'error',
  //             confirmButtonColor: '#0d6efd',
  //             confirmButtonText: Submit_Button,
  //           });
  //           return;
  //         }

  //         if (
  //           errorMessages.length > 0 &&
  //           errorMessage_code == 'มีรหัสอาจารย์ถูกใช้งานแล้ว'
  //         ) {
  //           console.log(errorMessages);
  //           console.log('My error teacher_code: ', errorMessage_code);
  //           // const errorMessage = errorMessages
  //           // .map((err: { th: string; en: string }) => (err as { [key: string]: string })[currentLang])
  //           // .join('<br>');

  //           const duplicatedCodes = errorMessages.join('<br>');

  //           Swal.fire({
  //             title: Fail_title,
  //             // html: `${teacherCode_duplicated}<br>${errorMessage}`,
  //             html: `${teacherCode_duplicated}<br>${duplicatedCodes}`,
  //             icon: 'error',
  //             confirmButtonColor: '#0d6efd',
  //             confirmButtonText: Submit_Button,
  //           });
  //           return;
  //         }
  //       }

  //       Swal.fire({
  //         title: Fail_title,
  //         text: Fail_text,
  //         icon: 'error',
  //         confirmButtonText: Submit_Button,
  //         confirmButtonColor: '#0d6efd',
  //       });
  //     }
  //   );
  // }

  onSaveData() {
    const currentLang = localStorage.getItem('language') || 'en';
  
    // ตรวจสอบว่ามีข้อมูลในตารางหรือไม่
    if (!this.rowData || this.rowData.length === 0) {
      Swal.fire({
        title: currentLang === 'th' ? 'ไม่มีข้อมูล' : 'No data',
        text:
          currentLang === 'th'
            ? 'กรุณาอัปโหลดข้อมูลก่อนบันทึก'
            : 'Please upload data before saving',
        icon: 'error',
        confirmButtonText: currentLang === 'th' ? 'ตกลง' : 'OK',
      });
      return;
    }

    const emailDuplicates = this.findDuplicates(this.rowData.map(row => row.email));
    const teacherCodeDuplicates = this.findDuplicates(this.rowData.map(row => row.teacher_code));

    if (emailDuplicates.length > 0 || teacherCodeDuplicates.length > 0) {
      let duplicateMessage = '';
      if (emailDuplicates.length > 0) {
        duplicateMessage += `${currentLang === 'th' ? 'อีเมลที่ซ้ำกันในตาราง' : 'Duplicate emails in the table'}:<br>${emailDuplicates.join('<br>')}<br><br>`;
      }
      if (teacherCodeDuplicates.length > 0) {
        duplicateMessage += `${currentLang === 'th' ? 'รหัสอาจารย์ที่ซ้ำกันในตาราง' : 'Duplicate teacher codes in the table'}:<br>${teacherCodeDuplicates.join('<br>')}<br><br>`;
      }
  
      Swal.fire({
        title: currentLang === 'th' ? 'พบข้อมูลซ้ำในตาราง' : 'Duplicate data found in table',
        html: duplicateMessage,
        icon: 'error',
        confirmButtonText: currentLang === 'th' ? 'ตกลง' : 'OK',
      });
      return;
    }
  
    const UserInfo = this.UserService.username;
  
    // กำหนดข้อมูลที่ต้องการส่ง
    const dataToSend = this.rowData.map((row) => {
      const { create_date, ...filteredRow } = row;
      return {
        ...filteredRow,
        create_by: UserInfo,
      };
    });
  
    const Success_title = this.translate.getTranslation('sweet_alert_success');
    const Submit_Button = this.translate.getTranslation('btn_ok');
    const Fail_title = this.translate.getTranslation('sweet_alert_fail_title');
    const Fail_text = this.translate.getTranslation('sweet_alert_fail_text');
    const email_duplicated = this.translate.getTranslation('email_duplicated');
    const teacherCode_duplicated = this.translate.getTranslation('add_user_duplicated_teachercode');
  
    // ส่งข้อมูลไปยัง API สำหรับการตรวจสอบข้อมูลที่สามารถบันทึกได้
    this.addUserService.insertUser(dataToSend).subscribe(
      (response) => {
        const validResources = response.validResources || [];
        const existingEmails = response.existingEmails || [];
        const existingTeacherCode = response.existingTeacherCode || [];
        const bothDuplicateData = response.bothDuplicateData || [];
  
        if (validResources.length > 0) {
          let errorMessage = '';
  
          // Handle duplicated email and teacher code
          if (existingEmails.length > 0) {
            errorMessage += `${email_duplicated}:<br>${existingEmails.join('<br>')}<br><br>`;
          }
          if (existingTeacherCode.length > 0) {
            errorMessage += `${teacherCode_duplicated}:<br>${existingTeacherCode.join('<br>')}<br><br>`;
          }
          if (bothDuplicateData.length > 0) {
            errorMessage += `รายการที่ซ้ำทั้งอีเมลและรหัสอาจารย์<br>${bothDuplicateData.map((r: any) => `${r.email} (${r.teacher_code})`).join('<br>')}<br><br>`;
          }
  
          // Show valid records that can be saved
          Swal.fire({
            title: 'คุณต้องการบันทึกข้อมูลผู้ใช้ดังนี้หรือไม่?',
            html: `
              <p>${currentLang === 'th' ? 'รายการต่อไปนี้สามารถบันทึกได้:' : 'The following records can be saved:'}</p>
              <ul>${validResources.map((r: any) => `<li>${r?.email || 'N/A'} (${r?.teacher_code || 'N/A'})</li>`).join('')}</ul>
              <br><br>
              ${errorMessage ? `<strong>${currentLang === 'th' ? 'ข้อมูลที่ซ้ำกัน:</strong>' : 'Duplicated data:'}</strong><br>${errorMessage}` : ''}
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0d6efd',
            confirmButtonText: currentLang === 'th' ? 'บันทึก' : 'Save',
            cancelButtonText: currentLang === 'th' ? 'ยกเลิก' : 'Cancel',
          }).then((result) => {
            if (result.isConfirmed) {
              // ส่ง validResources ไปยัง SaveValidUsers เพื่อบันทึกลงฐานข้อมูล
              this.addUserService.saveValidUsers(validResources).subscribe(
                (insertResponse: any) => {
                  Swal.fire({
                    title: currentLang === 'th' ? 'สำเร็จ' : 'Success',
                    text: currentLang === 'th' ? 'บันทึกข้อมูลสำเร็จ' : 'Data saved successfully',
                    icon: 'success',
                    confirmButtonColor: '#0d6efd',
                    confirmButtonText: Submit_Button,
                  }).then(() => {
                    this.CacheService.clearCacheForUrl('/api/EditUser/GetAllUser');
                    this.router.navigate(['/UserManagement']);
                  });
                },
                (error: any) => {
                  console.error('Error occurred while inserting user data: ', error);
                  Swal.fire({
                    title: Fail_title,
                    text: Fail_text,
                    icon: 'error',
                    confirmButtonText: Submit_Button,
                  });
                }
              );
            }
          });
        } else {
          Swal.fire({
            title: Fail_title,
            text: Fail_text,
            icon: 'error',
            confirmButtonText: Submit_Button,
          });
        }
      },
      (error) => {
        
        if (error && error.errors) {
          const errorMessages_email = error.errors.emails;
          const errorMessages_teacher_code = error.errors.teacher_codes;
          const errorMessage_code = error.message;

          if (
            errorMessages_email.length > 0 &&
            errorMessage_code == 'ไม่มีข้อมูลที่สามารถบันทึกได้'
          ) {
            console.log(errorMessages_email);
            console.log('My error email: ', errorMessage_code);
            // const errorMessage = errorMessages
            // .map((err: { th: string; en: string }) => (err as { [key: string]: string })[currentLang])
            //   .join('<br>');
            const duplicatedEmail = errorMessages_email.join('<br>');

            Swal.fire({
              title: Fail_title,
              html: `${email_duplicated}<br>${duplicatedEmail}`,
              icon: 'error',
              confirmButtonColor: '#0d6efd',
              confirmButtonText: Submit_Button,
            });
            return;
          }

          if (
            errorMessages_teacher_code.length > 0 &&
            errorMessage_code == 'ไม่มีข้อมูลที่สามารถบันทึกได้'
          ) {
            console.log(errorMessages_teacher_code);
            console.log('My error teacher_code: ', errorMessage_code);
            // const errorMessage = errorMessages
            // .map((err: { th: string; en: string }) => (err as { [key: string]: string })[currentLang])
            // .join('<br>');

            const duplicatedCodes = errorMessages_teacher_code.join('<br>');

            Swal.fire({
              title: Fail_title,
              // html: `${teacherCode_duplicated}<br>${errorMessage}`,
              html: `${teacherCode_duplicated}<br>${duplicatedCodes}`,
              icon: 'error',
              confirmButtonColor: '#0d6efd',
              confirmButtonText: Submit_Button,
            });
            return;
          }
        }

        Swal.fire({
          title: Fail_title,
          text: Fail_text,
          icon: 'error',
          confirmButtonText: Submit_Button,
        });
      }
    );
  }

  findDuplicates(arr: string[]): string[] {
    const uniqueItems = new Set();
    const duplicates = new Set();
    
    arr.forEach(item => {
      if (uniqueItems.has(item)) {
        duplicates.add(item);
      } else {
        uniqueItems.add(item);
      }
    });
    
    return Array.from(duplicates) as string[];  // Type assertion added here
  }  
  
  onDelete() {
    const title = this.translate.getTranslation('add_user_question_1');
    const text = this.translate.getTranslation('add_user_question_2');
    const delete_button = this.translate.getTranslation('add_user_delete');
    const cancel_button = this.translate.getTranslation('btn_cancel');

    Swal.fire({
      title: title,
      text: text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      // confirmButtonText: 'ลบ',
      cancelButtonColor: 'var(--secondary-color)',
      // cancelButtonText: 'ยกเลิก',
      confirmButtonText: delete_button,
      cancelButtonText: cancel_button,
    }).then((result) => {
      if (result.isConfirmed) {
        this.rowData = [];
        this.originalData = [];
        this.isFileUploaded = false;
        this.isUploaded.emit(false);
        console.log(this.rowData);
        console.log('ข้อมูลถูกลบแล้ว');
      } else if (result.isDismissed) {
        console.log('การบันทึกถูกยกเลิก');
      }
    });
  }

  validateFields(data: any[]): boolean {
    // if (!data || data.length === 0 || !data[0]) {
    if (data.length === 0){
      const Failed_title = this.translate.getTranslation(
        'add_user_failed_title'
      );
      const Failed_text = this.translate.getTranslation('add_user_failed_text');
      const submit = this.translate.getTranslation('btn_ok');

      Swal.fire({
        title: Failed_title,
        html: `${Failed_text}`,
        icon: 'error',
        confirmButtonText: submit,
        confirmButtonColor: '#0d6efd',
      });
      return false;
    }

    const Ok_button = this.translate.getTranslation('btn_ok');
    const Invalid_header = this.translate.getTranslation(
      'add_user_invalid_header'
    );
    const Validate_excel = this.translate.getTranslation(
      'add_user_validate_excel'
    );

    const requiredFields = [
      'อีเมล', // ถ้าไม่จำเป็นสามารถเอาออกได้
      'รหัสอาจารย์',
      'คำนำหน้า',
      'ชื่อ',
      'นามสกุล',
      'หน้าที่',
    ];

    const fileFields = Object.keys(data[0]).map((field) => field.trim());

    console.log("NEW GEN:", fileFields)

    const missingFields = requiredFields.filter(
      (field) => !fileFields.some((f) => f.trim() === field.trim())
    );

    // ถ้ามีคอลัมน์ที่ขาดหายไป ให้แสดงข้อความเตือน
    if (missingFields.length > 0) {
      Swal.fire({
        title: Invalid_header,
        html: `${Validate_excel}:<br>${missingFields.join('<br>')}`,
        icon: 'warning',
        confirmButtonText: Ok_button,
        confirmButtonColor: '#0d6efd',
      });
      return false;
    }

    return true;
  }

  onDownloadTemplate() {
    const filePath = 'assets/templates/Template-uploadUser.xlsx';

    const link = document.createElement('a');
    link.href = filePath;
    link.download = 'Template-อัปโหลดผู้ใช้งานระบบ.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: this.translate.getTranslation(
        'swal_downloadTemplateSuccess_title'
      ),
      text: this.translate.getTranslation('swal_downloadTemplateSuccess_text'),
      confirmButtonColor: '#0d6efd',
      confirmButtonText: this.translate.getTranslation('btn_ok'),
    });
  }
}