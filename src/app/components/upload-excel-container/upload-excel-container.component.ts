import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import * as XLSX from 'xlsx';
import { FormBuilder, FormGroup } from '@angular/forms';
import Swal from 'sweetalert2';
import { UploadScoreService } from '../../services/upload-score/upload-score.service';
import { UserService } from '../../services/sharedService/userService/userService.service';
import { SelectBoxService } from '../../services/select-box/select-box.service';
import { TranslationService } from '../../core/services/translation.service';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { CacheService } from '../../core/services/cache.service';
import { SignalRService } from '../../services/sharedService/signalRService/signal-r.service';

@Component({
  selector: 'app-upload-excel-container',
  standalone: false,

  templateUrl: './upload-excel-container.component.html',
  styleUrl: './upload-excel-container.component.css',
})
export class UploadExcelContainerComponent implements OnInit {
  @Input() titleName: string = 'No title'; // รับค่าจาก Parent
  @Input() buttonName: string = 'No title'; // รับค่าจาก Parent

  //return to parent
  // @Output() isUploaded: boolean = false;
  @Output() isUploaded = new EventEmitter<boolean>(); // ส่งค่ากลับไปยัง Parent

  //view child

  //lang
  currentLanguage!: string;

  @Output() submitRequest = new EventEmitter<void>();
  @Output() sendDataToApi = new EventEmitter<any>(); // Emit final data to send to API

  public form: FormGroup;

  rowData: any[] = []; // ข้อมูลที่จะแสดงใน ag-Grid
  columnDefs: any[] = []; // คำนิยามของคอลัมน์
  originalData: any[] = []; // สำหรับใช้กรองข้อมูล
  isFileUploaded = false; // flag ตรวจสอบการอัปโหลดไฟล์

  //masterData
  majorList: any[] = [];

  gridApi!: GridApi<any>;

  //for get form state
  @Input() isButtonDisabled = true;

  defaultColDef = {
    sortable: true,
    // filter: true,
    resizable: true,
  };

  requiredFields = [
    'ลำดับที่',
    'รหัสนิสิต',
    // 'คำนำหน้า',
    'ชื่อ-นามสกุล',
    'รหัสสาขา',
    'Email Google',
    // 'คะแนนระหว่างเรียน',
    // 'คะแนนกลางภาค',
    // 'คะแนนปลายภาค',
  ]; // ฟีลด์ที่ต้องการ

  optionalFields = ['คะแนนระหว่างเรียน', 'คะแนนกลางภาค', 'คะแนนปลายภาค'];

  constructor(
    private fb: FormBuilder,
    private uploadScoreService: UploadScoreService,
    private userService: UserService,
    private selectBoxService: SelectBoxService,
    private translationService: TranslationService,
    private cacheService: CacheService,
    private signalRService: SignalRService
  ) {
    this.form = this.fb.group({
      // subjectNo: [''],
      // subjectName: [''],
      search: [{ value: '', disabled: false }],
      majorCode: [{ value: null, disabled: false }],
    });
    this.loadMajor();
  }

  ngOnInit(): void {
    // this.detectLanguageChange();
    this.translationService.getTranslations().subscribe(() => {
      this.refreshHeaderNames(); // รีเฟรชชื่อคอลัมน์เมื่อเปลี่ยนภาษา
    });
  }

  //MasterData
  loadMajor() {
    this.selectBoxService.getSystemParamMajor().subscribe((resp) => {
      console.log(resp);
      this.majorList = resp;
    });
  }

  // เมื่อผู้ใช้ลากไฟล์เข้ามา
  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

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
    title: string = this.translationService.getTranslation(
      'swal_FileTypeInvalid_title'
    ),
    text: string = this.translationService.getTranslation(
      'swal_FileTypeInvalid_text'
    )
  ): Promise<boolean> {
    console.error(logMessage); // แสดงรายละเอียดข้อผิดพลาดใน log
    return Swal.fire({
      icon: 'error',
      title: title,
      text: text,
      confirmButtonColor: 'var(--secondary-color)',
      confirmButtonText: this.translationService.getTranslation('btn_close'),
    }).then(() => false); // คืนค่าผลลัพธ์เป็น false หลังจากที่ Swal เสร็จสิ้น
  }

  // ฟังก์ชันที่ใช้ในการประมวลผลไฟล์ทั้งจากการลากวางและการเลือกไฟล์
  processFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      // อ่านข้อมูลจาก Sheet แรก
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // ใช้ header: 1 เพื่อให้แถวแรกเป็น header
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      console.log(jsonData); // ตรวจสอบข้อมูลที่ได้

      // ตรวจสอบข้อมูลด้วย validateData
      if (this.validateData(jsonData)) {
        // เปลี่ยน jsonData จากอาร์เรย์ 2 มิติให้เป็นอาร์เรย์ของอ็อบเจ็กต์
        const mappedData = this.mapJsonData(jsonData);
        console.log('mappedData', mappedData);
        // ถ้าไม่มีข้อผิดพลาด ทำการประมวลผลข้อมูล
        const modifiedData = this.processData(mappedData);
        console.log('modifiedData', modifiedData);
        this.loadGridData(modifiedData); // โหลดข้อมูลลงใน ag-Grid
        this.isFileUploaded = true; // ตั้งค่า flag เมื่อไฟล์อัปโหลดแล้ว
        this.isUploaded.emit(true); // แจ้ง Parent ว่าไฟล์ถูกอัปโหลดสำเร็จ
      }
    };

    reader.readAsArrayBuffer(file);
  }

  // ฟังก์ชันสำหรับ mapping jsonData ให้สามารถใช้โค้ดเดิมได้
  mapJsonData(data: any[]): any[] {
    const headers = data[0]; // ใช้แถวแรกเป็น header
    const rows = data.slice(1); // ใช้แถวที่เหลือเป็นข้อมูลจริง

    return rows.map((row) => {
      // สร้างอ็อบเจ็กต์โดยจับคู่ชื่อฟิลด์จาก headers กับข้อมูลในแถว
      const rowData: any = {};

      headers.forEach((header: string, index: number) => {
        rowData[header] = row[index]; // ค่าของแต่ละคอลัมน์
      });

      // คืนค่าข้อมูลในรูปแบบที่ต้องการ
      return {
        ลำดับ: rowData['ลำดับที่'] || '',
        รหัสนิสิต: rowData['รหัสนิสิต'] || '',
        // คำนำหน้า: rowData['คำนำหน้า'] || '',
        'ชื่อ-นามสกุล': rowData['ชื่อ-นามสกุล'] || '',
        รหัสสาขา: rowData['รหัสสาขา'] || '',
        อีเมล: rowData['Email Google'] || '',
        คะแนนระหว่างเรียน: this.parseScore(rowData['คะแนนระหว่างเรียน']),
        คะแนนกลางภาค: this.parseScore(rowData['คะแนนกลางภาค']),
        คะแนนปลายภาค: this.parseScore(rowData['คะแนนปลายภาค']),
      };
    });
  }

  parseScore(value: any): number | null {
    if (typeof value === 'string') {
      value = value.trim();
    }
    return value === null ||
      value === undefined ||
      value === '-' ||
      value === ''
      ? null
      : value;
  }

  validateData(jsonData: any[]): boolean {
    const headers = jsonData[0] || []; // แถวแรกของไฟล์ใช้เป็น header (field names)
    const dataRows = jsonData.slice(1); // ข้อมูลหลัง header
    let errorMessages: string[] = [];
    const fail_title = this.translationService.transform(
      'sweet_alert_fail_title'
    );
    const btnCloselTitle = this.translationService.transform('btn_close');
    const noDataText = this.translationService.transform(
      'uploadscore_error_noData'
    );
    const missingFieldText = this.translationService.transform(
      'uploadscore_error_missingField'
    );
    const requiredOptionalFieldText = this.translationService.transform(
      'uploadscore_error_requiredOptionalFields'
    );

    // ตรวจสอบ headers ว่ามีฟีลด์ที่ต้องการครบหรือไม่
    const missingFields = this.requiredFields.filter(
      (field) => !headers.includes(field)
    );

    // ตรวจสอบว่ามีฟีลด์ optional อย่างน้อย 1 ฟีลด์
    const hasAtLeastOneScoreField = this.optionalFields.some((field) =>
      headers.includes(field)
    );

    if (missingFields.length > 0) {
      errorMessages.push(`${missingFieldText} ${missingFields.join(', ')}`); //`ฟีลด์ที่ขาดหายไปใน header: ${missingFields.join(', ')}`
    }

    if (!hasAtLeastOneScoreField) {
      errorMessages.push(
        `${requiredOptionalFieldText} (${this.optionalFields.join(', ')})`
      );
    }

    // ตรวจสอบกรณีไม่มีข้อมูลใน dataRows
    if (dataRows.length === 0) {
      errorMessages.push(noDataText); //'ไม่มีข้อมูลในไฟล์ กรุณาอัปโหลดไฟล์ที่มีข้อมูล'
    } else {
      // ตรวจสอบว่าฟีลด์ในแต่ละแถวไม่มีค่าว่าง
      for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
        const row = dataRows[rowIndex];

        // ตรวจสอบฟีลด์ในแต่ละแถว
        this.requiredFields.forEach((field, fieldIndex) => {
          const fieldValue = row[fieldIndex]; // ใช้ index ในการจับคู่ค่าจากแต่ละแถว
          if (fieldValue == null || fieldValue === '') {
            const missingValueText = this.translationService.getTranslation(
              //value "ฟีลด์ "{field}" ในแถวที่ {rowIndex} เป็นค่าว่าง"
              'uploadscore_error_missingValue',
              { field: field, rowIndex: (rowIndex + 1).toString() } // แทนค่าใน {} ด้วย field และ rowIndex
            );
            errorMessages.push(`${missingValueText}`); //`ฟีลด์ "${field}" ในแถวที่ ${rowIndex + 1} เป็นค่าว่าง`
          }
        });
      }
    }

    // หากมี error เก็บทั้งหมดไว้ใน swal
    if (errorMessages.length > 0) {
      Swal.fire({
        title: fail_title,
        html: errorMessages.join('<br>'), // ใช้ <br> แทน \n เพื่อแสดงผลในบรรทัดใหม่
        icon: 'error',
        confirmButtonColor: 'var(--secondary-color)',
        confirmButtonText: btnCloselTitle,
      });
      return false;
    }

    return true;
  }

  processData(data: any[]): any[] {
    return data.map((row) => {
      // example row['ชื่อ-นามสกุล'] is นายสมชาย ใจดี
      const fullName = (row['ชื่อ-นามสกุล'] || '').trim();
      const prefixes = ['นาย', 'นางสาว', 'นาง', 'Mr.', 'Miss', 'Mrs.']; // คำนำหน้าที่อนุญาติให้ใช้

      let prefix = '';
      let namePart = fullName;

      for (const pre of prefixes) {
        if (fullName.startsWith(pre)) {
          prefix = pre;
          namePart = fullName.substring(pre.length).trim();
          break;
        }
      }

      const nameParts = namePart.split(/\s+/);
      let firstName = '';
      let lastName = '';
      if (nameParts.length > 1) {
        if (nameParts.length === 2) {
          // กรณีมีแค่่ชื่อจริง และ นามสกุล
          firstName = nameParts[0];
          lastName = nameParts[1];
        } else {
          //กรณีมีชื่อจริง ชื่อกลาง และ นามสกุล
          //Miss May Thet TIN MOE => prefix:"Miss"	First Name: "May Thet	TIN" Last Name: "MOE"
          firstName = nameParts.slice(0, -1).join(' '); // รวมชื่อจริง + ชื่อกลาง
          lastName = nameParts.slice(-1).join(''); // นามสกุล
        }
      } else {
        // กรณีไม่มีนามสกุล
        firstName = nameParts[0];
        lastName = '';
      }

      const totalScore =
        (row['คะแนนระหว่างเรียน'] || 0) +
        (row['คะแนนกลางภาค'] || 0) +
        (row['คะแนนปลายภาค'] || 0); // คำนวณคะแนนรวม

      // จัดเรียงข้อมูลตามลำดับที่กำหนด
      return {
        ลำดับ: row['ลำดับ'] || null,
        รหัสนิสิต: row['รหัสนิสิต'] || null,
        คำนำหน้า: prefix.trim().length > 0 ? prefix : null,
        ชื่อ: firstName || null,
        นามสกุล: lastName.trim().length > 0 ? lastName : null,
        รหัสสาขา: row['รหัสสาขา'] || null,
        อีเมล: row['อีเมล'] || null,
        คะแนนระหว่างเรียน: row['คะแนนระหว่างเรียน'],
        คะแนนกลางภาค: row['คะแนนกลางภาค'],
        คะแนนปลายภาค: row['คะแนนปลายภาค'],
        คะแนนรวม: totalScore,
      };
    });
  }

  onGridReady(params: GridReadyEvent<any>) {
    this.gridApi = params.api;
  }

  generateColumnDefs(data: any[]) {
    if (data.length === 0) {
      return [];
    }

    return Object.keys(data[0]).map((key) => {
      let customWidth = 100;
      let flexValue = 1;
      let cellClass = '';
      let fieldNameKey = '';
      let cellRenderer: any = null; // เพิ่ม cellRenderer สำหรับ custom rendering

      switch (key) {
        case 'ลำดับ':
          customWidth = 71;
          flexValue = 0.8;
          fieldNameKey = 'uploadscore_tableFieldSeatNo';
          cellRenderer = (params: any) => {
            const value = params.value;
            return this.TextNullCellRenderer(value);
          };
          break;
        case 'รหัสนิสิต':
          customWidth = 113;
          flexValue = 1.5;
          fieldNameKey = 'uploadscore_tableFieldStudentId';
          cellRenderer = (params: any) => {
            const value = params.value;
            return this.TextNullCellRenderer(value);
          };
          break;
        case 'คำนำหน้า':
          customWidth = 88;
          flexValue = 1.2;
          fieldNameKey = 'uploadscore_tableFieldPrefix';
          cellRenderer = (params: any) => {
            const value = params.value;
            return this.TextNullCellRenderer(value);
          };
          break;
        case 'ชื่อ':
          customWidth = 161;
          flexValue = 1.8;
          fieldNameKey = 'uploadscore_tableFieldFirstName';
          cellRenderer = (params: any) => {
            const value = params.value;
            return this.TextNullCellRenderer(value);
          };
          break;
        case 'นามสกุล':
          customWidth = 161;
          flexValue = 1.8;
          fieldNameKey = 'uploadscore_tableFieldLastName';
          cellRenderer = (params: any) => {
            const value = params.value;
            return this.TextNullCellRenderer(value);
          };
          break;
        case 'รหัสสาขา':
          customWidth = 90;
          flexValue = 1.2;
          fieldNameKey = 'uploadscore_tableFieldMajor';
          cellRenderer = (params: any) => {
            const value = params.value;
            return this.TextNullCellRenderer(value);
          };
          break;
        case 'อีเมล':
          customWidth = 210;
          flexValue = 2;
          fieldNameKey = 'uploadscore_tableFieldEmail';
          cellRenderer = (params: any) => {
            const value = params.value;
            return this.TextNullCellRenderer(value);
          };
          break;
        case 'คะแนนระหว่างเรียน':
          customWidth = 125;
          flexValue = 1.4;
          cellClass = 'text-end';
          fieldNameKey = 'uploadscore_tableFieldAccScore';
          cellRenderer = (params: any) => {
            const value = params.value;
            return this.ScoreNullCellRenderer(value);
          };
          break;
        case 'คะแนนกลางภาค':
          customWidth = 134;
          flexValue = 1.5;
          cellClass = 'text-end';
          fieldNameKey = 'uploadscore_tableFieldMidScore';
          cellRenderer = (params: any) => {
            const value = params.value;
            return this.ScoreNullCellRenderer(value);
          };
          break;
        case 'คะแนนปลายภาค':
          customWidth = 134;
          flexValue = 1.5;
          cellClass = 'text-end';
          fieldNameKey = 'uploadscore_tableFieldFinScore';
          cellRenderer = (params: any) => {
            const value = params.value;
            return this.ScoreNullCellRenderer(value);
          };
          break;
        case 'คะแนนรวม':
          customWidth = 126.6;
          flexValue = 1.3;
          cellClass = 'text-end';
          fieldNameKey = 'uploadscore_tableFieldTotalScore';
          cellRenderer = (params: any) => {
            const value = params.value;
            return this.ScoreNullCellRenderer(value);
          };
          break;
        default:
          customWidth = 160;
          fieldNameKey = key;
      }

      const translatedHeader =
        this.translationService.getTranslation(fieldNameKey);

      return {
        field: key,
        headerName: translatedHeader || key,
        flex: flexValue,
        minWidth: customWidth,
        cellClass: cellClass,
        cellRenderer: cellRenderer, // เพิ่ม cellRenderer
      };
    });
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
  private TextNullCellRenderer(value: any): string {
    if (
      value === null ||
      value === undefined ||
      value.toString().trim() === ''
    ) {
      return `<span style="color: red; font-weight: bold; background-color: #ffcccc; padding: 2px 5px; border-radius: 3px;">NULL</span>`;
    }
    return value;
  }

  // ฟังก์ชันสำหรับโหลดข้อมูลใน grid
  loadGridData(data: any[]) {
    if (data.length > 0) {
      console.log(data);
      this.rowData = data;
      this.originalData = data;
      this.columnDefs = this.generateColumnDefs(data);
      console.log(this.rowData);
    }
  }

  // ฟังก์ชันสำหรับรีเฟรชชื่อคอลัมน์เมื่อเปลี่ยนภาษา
  refreshHeaderNames() {
    if (this.originalData && this.originalData.length > 0) {
      this.columnDefs = this.generateColumnDefs(this.originalData);
    }
  }

  // ng-select
  onSelectChange(selectedValue: any, controlName: string): void {
    if (selectedValue && selectedValue.value === null) {
      this.form.get(controlName)?.reset();
    }
  }

  onSubmitFilter() {
    const formValues = this.form.value; // ค่า input จากฟอร์ม
    console.log(this.originalData);

    // ถ้าไม่มีการกรอกข้อมูล แสดงข้อมูลทั้งหมด
    if (!formValues.search && !formValues.majorCode) {
      this.rowData = [...this.originalData]; // คัดลอก originalData
      return;
    }

    // กรองข้อมูลจาก originalData
    this.rowData = this.originalData.filter((row: any) => {
      // ฟังก์ชันย่อยสำหรับตรวจสอบ search
      const matchesSearch = formValues.search
        ? row['รหัสนิสิต']?.toString().includes(formValues.search) || // แปลงเป็น string
          row['ชื่อ']?.includes(formValues.search) ||
          row['นามสกุล']?.includes(formValues.search) ||
          row['อีเมล']?.includes(formValues.search)
        : true;

      // ฟังก์ชันย่อยสำหรับตรวจสอบ majorCode
      const matchesMajorCode = formValues.majorCode
        ? row['รหัสสาขา'] === formValues.majorCode
        : true;

      return matchesSearch && matchesMajorCode; // ต้องตรงทั้งสองเงื่อนไข
    });
  }

  onSubmitWithGridData(): void {
    if (this.form.valid) {
      // รวมข้อมูลจากฟอร์มและ ag-Grid
      const combinedData = {
        formData: this.form.value,
        gridData: this.rowData,
      };

      console.log('Combined Data:', combinedData);

      // // ส่งข้อมูลไปยัง parent component
      // this.isUploaded.emit(combinedData); // หรือส่งข้อมูลนี้ไปยัง API
    } else {
      console.log('Form is invalid');
    }
  }
  //save data
  onSaveData() {
    // 2.send emitter to parent component
    this.submitRequest.emit();
  }

  // 11. call service for send to API
  sendToApi(formData: any) {
    const successTitle = this.translationService.getTranslation(
      'uploadscore_swalSave_title'
    );
    const successText = this.translationService.getTranslation(
      'uploadscore_swalSave_text',
      { number: this.rowData.length.toString() }
    );
    const failTitle = this.translationService.getTranslation(
      'sweet_alert_fail_title'
    );
    const okBtnText = this.translationService.getTranslation('btn_ok');
    const closeBtnText = this.translationService.getTranslation('btn_close');

    let progressSwal: any; // ตัวแปรเก็บ Swal Instance

    // แสดง Swal แบบ Progress ไม่ให้ปิดได้
    const spinnerIcon = `
        <svg width="80" height="80" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="20" r="15" fill="#25b09b">
            <animateTransform attributeName="transform" type="rotate"
              values="0 50 50; 90 50 50; 90 50 50; 180 50 50; 180 50 50; 270 50 50; 270 50 50; 360 50 50; 360 50 50;"
              keyTimes="0;0.125;0.25;0.375;0.5;0.625;0.75;0.875;1"
              dur="4s" repeatCount="indefinite"/>
          </circle>
        <circle cx="20" cy="50" r="15" fill="#25b09b">
            <animateTransform attributeName="transform" type="rotate"
              values="0 50 50; 90 50 50; 90 50 50; 180 50 50; 180 50 50; 270 50 50; 270 50 50; 360 50 50; 360 50 50;"
              keyTimes="0;0.125;0.25;0.375;0.5;0.625;0.75;0.875;1"
              dur="4s" repeatCount="indefinite"/>
          </circle>
          <circle cx="80" cy="50" r="15" fill="#25b09b">
            <animateTransform attributeName="transform" type="rotate"
              values="0 50 50; 90 50 50; 90 50 50; 180 50 50; 180 50 50; 270 50 50; 270 50 50; 360 50 50; 360 50 50;"
              keyTimes="0;0.125;0.25;0.375;0.5;0.625;0.75;0.875;1"
              dur="4s" repeatCount="indefinite"/>
          </circle>
          <circle cx="50" cy="80" r="15" fill="#25b09b">
            <animateTransform attributeName="transform" type="rotate"
              values="0 50 50; 90 50 50; 90 50 50; 180 50 50; 180 50 50; 270 50 50; 270 50 50; 360 50 50; 360 50 50;"
              keyTimes="0;0.125;0.25;0.375;0.5;0.625;0.75;0.875;1"
              dur="4s" repeatCount="indefinite"/>
          </circle>
        </svg>
        `;
    const progressText = this.translationService.getTranslation(
      'scoreannouncement_swalUploadScoreProcessing_text',
      { processed: '0', total: this.rowData.length.toString() }
    );
    Swal.fire({
      title: this.translationService.getTranslation(
        'scoreannouncement_swalUploadScoreProcessing_title'
      ),
      iconHtml: spinnerIcon, // ใช้ custom spinner
      html: `<p id="swal-progress-text">${progressText}</p>`, // ใช้ <p> เพื่ออัปเดตเฉพาะส่วนนี้
      allowEscapeKey: false,
      showConfirmButton: false,
      customClass: {
        icon: 'no-border',
      },
      allowOutsideClick: () => {
        const popup = Swal.getPopup() as HTMLElement;
        popup.classList.remove('swal2-show');
        setTimeout(() => {
          popup.classList.add('animate__animated', 'animate__headShake');
          popup.style.animation = 'headShake 1s ease-in-out';
        });
        setTimeout(() => {
          popup.classList.remove('animate__animated', 'animate__headShake');
        }, 500);
        return false;
      },
      didOpen: () => {
        progressSwal = Swal.getPopup();
      },
    });
    this.signalRService.startProgressConnection();
    // ติดตาม progress และอัปเดต Swal
    this.signalRService.progress$.subscribe(({ successCount, failCount }) => {
      if (progressSwal) {
        const progressTextEm = document.getElementById('swal-progress-text');
        if (progressTextEm) {
          const text = this.translationService.getTranslation(
            'scoreannouncement_swalUploadScoreProcessing_text',
            {
              processed: (successCount + failCount).toString(),
              total: this.rowData.length.toString(),
            }
          );
          progressTextEm.innerHTML = text;
        }
      }
    });

    // Mapping rowData to match the ScoreStudent model
    const studentScoreData = {
      data: this.rowData.map((item) => ({
        seat_no: item['ลำดับ']?.toString(),
        student_id: item['รหัสนิสิต']?.toString(),
        prefix: item['คำนำหน้า'],
        firstname: item['ชื่อ'],
        lastname: item['นามสกุล'],
        major_code: item['รหัสสาขา'],
        email: item['อีเมล'],
        accumulated_score: item['คะแนนระหว่างเรียน'],
        midterm_score: item['คะแนนกลางภาค'],
        final_score: item['คะแนนปลายภาค'],
        total_score: item['คะแนนรวม'],
      })),
    };
    const subjectData = {
      subject: {
        subject_id: formData.subjectCode,
        subject_name: formData.subjectName,
        academic_year: formData.academicYearCode,
        semester: formData.semesterCode,
        section: formData.sectionCode,
        teacher: formData.teacher,
      },
    };
    console.log(this.rowData);
    // add payload : subjectDetail and list student score
    const payload = {
      ...studentScoreData,
      ...subjectData,
      username: this.userService.username,
    }; // Merge formData with additionalData
    console.log('Final Payload to API:', payload);
    this.uploadScoreService.uploadScore(payload).subscribe(
      (response) => {
        console.log('Success', response);
        if (response.isSuccess) {
          this.cacheService.clearCacheForUrl('/api/MasterData/Subject');
          this.cacheService.clearCacheForUrl(
            '/api/Dashboard/GetSubjectDashboard'
          );
          this.cacheService.clearCacheForUrl('/api/LovContant/GetLovSubject');
          Swal.fire({
            title: successTitle,
            text: successText,
            icon: 'success',
            confirmButtonColor: 'var(--primary-color)',
            confirmButtonText: okBtnText,
          }).then((result) => {
            if (result.isConfirmed) {
              // หากคลิก "ตกลง"
              console.log('success : ', response.messageDesc);
            }
          });
        } else {
          const failText = this.translationService.transform(
            response.message.messageKey,
            response.parameter
          );
          Swal.fire({
            title: failTitle,
            // text: failText || response.message.messageDescription,
            html: (failText || response.message.messageDescription).replace(
              /\n/g,
              '<br>'
            ),

            icon: 'error',
            confirmButtonColor: 'var(--secondary-color)',
            confirmButtonText: closeBtnText,
          }).then((result) => {
            if (result.isConfirmed) {
              // หากคลิก "ตกลง"
              console.log('error : ', response.messageDesc);
            }
          });
        }
        this.signalRService.stopProgressConnection();
      },
      (error) => {
        this.signalRService.stopProgressConnection();
        console.log('Error', error);
        const title = this.translationService.getTranslation(
          'swalServerError_title'
        );
        const text = this.translationService.getTranslation(
          'swalServerError_text'
        );
        Swal.fire({
          title: title,
          text: text,
          icon: 'error',
          confirmButtonColor: 'var(--secondary-color)',
          confirmButtonText: closeBtnText,
        });
      },
      () => {
        console.log('Complete');
      }
    );
  }

  // ลบข้อมูลใน ag-Grid
  onDelete() {
    const deleteTitle = this.translationService.getTranslation(
      'uploadscore_swalDelete_title'
    );
    const deleteText = this.translationService.getTranslation(
      'uploadscore_swalDelete_text'
    );
    const deleteBtnText = this.translationService.getTranslation('btn_delete');
    const cancelBtnText = this.translationService.getTranslation('btn_cancel');

    Swal.fire({
      title: deleteTitle,
      text: deleteText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--danger-color)',
      confirmButtonText: deleteBtnText,
      cancelButtonColor: 'var(--secondary-color)',
      cancelButtonText: cancelBtnText,
    }).then((result) => {
      if (result.isConfirmed) {
        // หากคลิก "ตกลง"
        this.rowData = []; // ล้างข้อมูลทั้งหมดจาก ag-Grid
        this.isFileUploaded = false; // ปรับ flag เพื่อแสดง UI สำหรับการอัปโหลดไฟล์ใหม่
        this.isUploaded.emit(false); // แจ้ง Parent ว่าไฟล์ถูกอัปโหลดสำเร็จ
        console.log(this.rowData);
        console.log('ข้อมูลถูกลบแล้ว');
      } else if (result.isDismissed) {
        // หากคลิก "ยกเลิก"
        console.log('การบันทึกถูกยกเลิก');
      }
    });
  }

  customSearchFn(term: string, item: any): boolean {
    return this.translationService.searchFn(term, item);
  }

  onDownloadTemplate() {
    const filePath = 'assets/templates/Template-uploadStudentScore.xlsx';

    const link = document.createElement('a');
    link.href = filePath;
    link.download = 'Template-อัปโหลดคะแนนนิสิต.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: this.translationService.getTranslation(
        'swal_downloadTemplateSuccess_title'
      ),
      text: this.translationService.getTranslation(
        'swal_downloadTemplateSuccess_text'
      ),
      confirmButtonText: this.translationService.getTranslation('btn_ok'),
      confirmButtonColor: 'var(--primary-color)',
    });
  }
}
