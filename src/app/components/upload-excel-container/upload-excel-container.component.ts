import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
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
import { UploadScoreHeaderComponent } from '../upload-score-header/upload-score-header.component';
import Swal from 'sweetalert2';
import { UploadScoreService } from '../../services/upload-score/upload-score.service';
import { UserService } from '../../services/sharedService/userService/userService.service';
import { SelectBoxService } from '../../services/select-box/select-box.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import {
  ClientSideRowModelModule,
  ColDef,
  ColGroupDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  ModuleRegistry,
  createGrid,
} from 'ag-grid-community';
import { Subscription } from 'rxjs';

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
  @ViewChild(UploadScoreHeaderComponent, { static: false })
  subjectDetailComponent?: UploadScoreHeaderComponent;

  //pipe
  private translatePipe: TranslatePipe;

  //lang
  currentLanguage!: string;
  private translationSubscription!: Subscription;

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

  filteredSubjects = [
    {
      subjectCode: '01418442-60',
      subjectName: 'Web Technology and Web Services',
    },
    { subjectCode: '01418499-65', subjectName: 'Computer Science Project' },
    {
      subjectCode: '01418221-60',
      subjectName: 'Fundamentals of Database Systems',
    },
    {
      subjectCode: '01418222-60',
      subjectName: 'Internet Application for Commerce',
    },
    {
      subjectCode: '01418233-60',
      subjectName: 'Assembly Language and Computer Architecture',
    },
  ];
  majorCodeOptions = [
    { value: null, label: 'กรุณาเลือก' },
    { value: 'S05', label: 'S05' },
    { value: 'S06', label: 'S06' },
    { value: 'S09', label: 'S09' },
    { value: 'S10', label: 'S11' },
  ];

  defaultColDef = {
    sortable: true,
    // filter: true,
    resizable: true,
  };

  requiredFields = [
    'ลำดับ',
    'รหัสนิสิต',
    'คำนำหน้า',
    'ชื่อ-นามสกุล',
    'รหัสสาขา',
    'อีเมล',
    'คะแนนระหว่างเรียน',
    'คะแนนกลางภาค',
    'คะแนนปลายภาค',
  ]; // ฟีลด์ที่ต้องการ

  constructor(
    private fb: FormBuilder,
    private uploadScoreService: UploadScoreService,
    private userService: UserService,
    private selectBoxService: SelectBoxService,
    private translationService: TranslationService
  ) {
    this.form = this.fb.group({
      // subjectNo: [''],
      // subjectName: [''],
      search: [{ value: '', disabled: false }],
      majorCode: [{ value: null, disabled: false }],
    });
    this.loadMajor();
    this.translatePipe = new TranslatePipe(this.translationService);
  }

  ngOnInit(): void {
    // this.detectLanguageChange();
    this.translationService.getTranslations().subscribe(() => {
      this.refreshHeaderNames(); // รีเฟรชชื่อคอลัมน์เมื่อเปลี่ยนภาษา
    });
    // this.langSubscription = this.languageService
    //   .getCurrentLanguageObservable()
    //   .subscribe((lang) => {
    //     this.currentLanguage = lang;
    //     console.log('Current Language:', lang);
    //     this.refreshHeaderNames(); // อัปเดต UI
    //   });
    // if (typeof window !== 'undefined') {
    //   let currentLanguage = localStorage.getItem('language') || 'en';
    //   const newLanguage = localStorage.getItem('language');
    //   if (newLanguage && newLanguage !== currentLanguage) {
    //     currentLanguage = newLanguage;
    //     this.refreshHeaderNames();
    //   }
    // }
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
      this.processFile(file);
    }
  }

  // เมื่อเลือกไฟล์จาก input
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.processFile(file);
    }
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

        // ถ้าไม่มีข้อผิดพลาด
        // ทำการประมวลผลข้อมูล
        const modifiedData = this.processData(mappedData);
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
        ลำดับ: rowData['ลำดับ'] || '',
        รหัสนิสิต: rowData['รหัสนิสิต'] || '',
        คำนำหน้า: rowData['คำนำหน้า'] || '',
        'ชื่อ-นามสกุล': rowData['ชื่อ-นามสกุล'] || '',
        รหัสสาขา: rowData['รหัสสาขา'] || '',
        อีเมล: rowData['อีเมล'] || '',
        คะแนนระหว่างเรียน: rowData['คะแนนระหว่างเรียน'] || 0,
        คะแนนกลางภาค: rowData['คะแนนกลางภาค'] || 0,
        คะแนนปลายภาค: rowData['คะแนนปลายภาค'] || 0,
      };
    });
  }

  validateData(jsonData: any[]): boolean {
    const headers = jsonData[0] || []; // แถวแรกของไฟล์ใช้เป็น header (field names)
    const dataRows = jsonData.slice(1); // ข้อมูลหลัง header
    let errorMessages: string[] = [];

    // ตรวจสอบ headers ว่ามีฟีลด์ที่ต้องการครบหรือไม่
    const missingFields = this.requiredFields.filter(
      (field) => !headers.includes(field)
    );

    if (missingFields.length > 0) {
      errorMessages.push(
        `ฟีลด์ที่ขาดหายไปใน header: ${missingFields.join(', ')}`
      );
    }

    // ตรวจสอบกรณีไม่มีข้อมูลใน dataRows
    if (dataRows.length === 0) {
      errorMessages.push('ไม่มีข้อมูลในไฟล์ กรุณาอัปโหลดไฟล์ที่มีข้อมูล');
    } else {
      // ตรวจสอบว่าฟีลด์ในแต่ละแถวไม่มีค่าว่าง
      for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
        const row = dataRows[rowIndex];

        // ตรวจสอบฟีลด์ในแต่ละแถว
        this.requiredFields.forEach((field, fieldIndex) => {
          const fieldValue = row[fieldIndex]; // ใช้ index ในการจับคู่ค่าจากแต่ละแถว
          if (fieldValue == null || fieldValue === '') {
            errorMessages.push(
              `ฟีลด์ "${field}" ในแถวที่ ${rowIndex + 1} เป็นค่าว่าง`
            );
          }
        });
      }
    }

    // หากมี error เก็บทั้งหมดไว้ใน swal
    if (errorMessages.length > 0) {
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        // text: errorMessages.join('\n'), // แสดงข้อความ error ทั้งหมดใน swal
        html: errorMessages.join('<br>'), // ใช้ <br> แทน \n เพื่อแสดงผลในบรรทัดใหม่
        icon: 'error',
        confirmButtonColor: 'var(--secondary-color)',
        confirmButtonText: 'ปิด',
      });
      return false;
    }

    return true;
  }

  validateHeaders(headers: any): boolean {
    const missingFields = this.requiredFields.filter(
      (field) => !headers.includes(field)
    );

    if (missingFields.length > 0) {
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: `ฟีลด์ที่ขาดหายไป: ${missingFields.join(', ')}`,
        icon: 'error',
        confirmButtonColor: 'var(--secondary-color)',
        confirmButtonText: 'ปิด',
      });
      return false;
    }
    return true;
  }

  validateFields(data: any[]): boolean {
    const dataRows = data;
    const fileFields = Object.keys(data[0] || {}); // ชื่อฟีลด์จากไฟล์ Excel (เผื่อกรณีไฟล์ไม่มีข้อมูล)

    // ตรวจสอบว่าไฟล์มีฟีลด์ครบตามที่กำหนด
    const missingFields = this.requiredFields.filter(
      (field) => !fileFields.includes(field)
    );

    // ตรวจสอบกรณีฟีลด์ไม่ครบและไม่มีข้อมูลใน row
    if (missingFields.length > 0 && dataRows.length === 0) {
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: `ฟีลด์ที่ขาดหายไป: ${missingFields.join(
          ', '
        )} และไม่มีข้อมูลในไฟล์`,
        icon: 'error',
        confirmButtonColor: 'var(--secondary-color)',
        confirmButtonText: 'ปิด',
      });
      return false;
    }

    // ตรวจสอบกรณีฟีลด์ไม่ครบ
    if (missingFields.length > 0) {
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: `ฟีลด์ที่ขาดหายไป: ${missingFields.join(', ')}`,
        icon: 'error',
        confirmButtonColor: 'var(--secondary-color)',
        confirmButtonText: 'ปิด',
      });
      return false;
    }

    // ตรวจสอบกรณีไม่มี row data
    if (dataRows.length === 0) {
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: 'ข้อมูลไม่พบ กรุณาอัปโหลดไฟล์ที่มีข้อมูล',
        icon: 'error',
        confirmButtonColor: 'var(--secondary-color)',
        confirmButtonText: 'ปิด',
      });
      return false;
    }

    // ตรวจสอบทุกแถวว่าไม่มีฟีลด์ที่เป็นค่าว่าง
    for (const row of dataRows) {
      for (const field of this.requiredFields) {
        if (!row[field] || row[field] === '') {
          Swal.fire({
            title: 'เกิดข้อผิดพลาด',
            text: `ฟีลด์ "${field}" ในแถวที่ ${
              dataRows.indexOf(row) + 1
            } เป็นค่าว่าง`,
            icon: 'error',
            confirmButtonColor: 'var(--secondary-color)',
            confirmButtonText: 'ปิด',
          });
          return false;
        }
      }
    }

    return true;
  }

  processData(data: any[]): any[] {
    return data.map((row) => {
      const [firstName, lastName] = (row['ชื่อ-นามสกุล'] || '').split(' '); // แยกชื่อและนามสกุล
      const totalScore =
        (row['คะแนนระหว่างเรียน'] || 0) +
        (row['คะแนนกลางภาค'] || 0) +
        (row['คะแนนปลายภาค'] || 0); // คำนวณคะแนนรวม

      // จัดเรียงข้อมูลตามลำดับที่กำหนด
      return {
        ลำดับ: row['ลำดับ'] || '',
        รหัสนิสิต: row['รหัสนิสิต'] || '',
        คำนำหน้า: row['คำนำหน้า'] || '',
        ชื่อ: firstName || '',
        นามสกุล: lastName || '',
        รหัสสาขา: row['รหัสสาขา'],
        อีเมล: row['อีเมล'],
        คะแนนระหว่างเรียน: row['คะแนนระหว่างเรียน'] || 0,
        คะแนนกลางภาค: row['คะแนนกลางภาค'] || 0,
        คะแนนปลายภาค: row['คะแนนปลายภาค'] || 0,
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

      switch (key) {
        case 'ลำดับ':
          customWidth = 71;
          flexValue = 0.8;
          fieldNameKey = 'uploadscore_tableFieldSeatNo';
          break;
        case 'รหัสนิสิต':
          customWidth = 113;
          flexValue = 1.5;
          fieldNameKey = 'uploadscore_tableFieldStudentId';
          break;
        case 'คำนำหน้า':
          customWidth = 88;
          flexValue = 1.2;
          fieldNameKey = 'uploadscore_tableFieldPrefix';
          break;
        case 'ชื่อ':
          customWidth = 161;
          flexValue = 1.8;
          fieldNameKey = 'uploadscore_tableFieldFirstName';
          break;
        case 'นามสกุล':
          customWidth = 161;
          flexValue = 1.8;
          fieldNameKey = 'uploadscore_tableFieldLastName';
          break;
        case 'รหัสสาขา':
          customWidth = 90;
          flexValue = 1.2;
          fieldNameKey = 'uploadscore_tableFieldMajor';
          break;
        case 'อีเมล':
          customWidth = 210;
          flexValue = 2;
          fieldNameKey = 'uploadscore_tableFieldEmail';
          break;
        case 'คะแนนระหว่างเรียน':
          customWidth = 125;
          flexValue = 1.4;
          cellClass = 'text-end';
          fieldNameKey = 'uploadscore_tableFieldAccScore';
          break;
        case 'คะแนนกลางภาค':
          customWidth = 134;
          flexValue = 1.5;
          cellClass = 'text-end';
          fieldNameKey = 'uploadscore_tableFieldMidScore';
          break;
        case 'คะแนนปลายภาค':
          customWidth = 134;
          flexValue = 1.5;
          cellClass = 'text-end';
          fieldNameKey = 'uploadscore_tableFieldFinScore';
          break;
        case 'คะแนนรวม':
          customWidth = 126.6;
          flexValue = 1.3;
          cellClass = 'text-end';
          fieldNameKey = 'uploadscore_tableFieldTotalScore';
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
      };
    });
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
    //list student score from Excel

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
        teacher: ['6430250440', 'S2042'],
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
          Swal.fire({
            title: 'บันทึกคะแนนนิสิตสำเร็จ',
            icon: 'success',
            confirmButtonColor: 'var(--primary-color)',
            confirmButtonText: 'ตกลง',
          }).then((result) => {
            if (result.isConfirmed) {
              // หากคลิก "ตกลง"
              console.log('success : ', response.messageDesc);
            }
          });
        } else {
          Swal.fire({
            title: 'เกิดข้อผิดพลาด',
            text: response.message.messageDescription,
            icon: 'error',
            confirmButtonColor: 'var(--secondary-color)',
            confirmButtonText: 'ปิด',
          }).then((result) => {
            if (result.isConfirmed) {
              // หากคลิก "ตกลง"
              console.log('error : ', response.messageDesc);
            }
          });
        }
      },
      (error) => {
        console.log('Error', error);
      },
      () => {
        console.log('Complete');
      }
    );
  }

  // ลบข้อมูลใน ag-Grid
  onDelete() {
    Swal.fire({
      title: 'ต้องการลบข้อมูลใช่หรือไม่',
      text: 'หลังจากลบข้อมูลแล้วจะไม่สามารถกลับมาแก้ไขได้',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--danger-color)',
      confirmButtonText: 'ลบ',
      cancelButtonColor: 'var(--secondary-color)',
      cancelButtonText: 'ยกเลิก',
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
}
