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
import { UploadScoreHeaderComponent } from '../upload-score-header/upload-score-header.component';
import Swal from 'sweetalert2';
import { UploadScoreService } from '../../services/upload-score/upload-score.service';
import { UserService } from '../../services/sharedService/userService/userService.service';

@Component({
  selector: 'app-upload-excel-container',
  standalone: false,

  templateUrl: './upload-excel-container.component.html',
  styleUrl: './upload-excel-container.component.css',
})
export class UploadExcelContainerComponent {
  @Input() titleName: string = 'No title'; // รับค่าจาก Parent
  @Input() buttonName: string = 'No title'; // รับค่าจาก Parent

  //return to parent
  // @Output() isUploaded: boolean = false;
  @Output() isUploaded = new EventEmitter<boolean>(); // ส่งค่ากลับไปยัง Parent

  //view child
  // @ViewChild('subjectDetailForm', { read: FormGroupDirective })
  // subjectDetailFormRef?: FormGroupDirective;
  // @ViewChild(SubjectDetailComponent)
  // subjectDetailComponent: SubjectDetailComponent;
  @ViewChild(UploadScoreHeaderComponent, { static: false })
  subjectDetailComponent?: UploadScoreHeaderComponent;

  @Output() submitRequest = new EventEmitter<void>();
  @Output() sendDataToApi = new EventEmitter<any>(); // Emit final data to send to API

  public form: FormGroup;

  rowData: any[] = []; // ข้อมูลที่จะแสดงใน ag-Grid
  columnDefs: any[] = []; // คำนิยามของคอลัมน์
  originalData: any[] = []; // สำหรับใช้กรองข้อมูล
  isFileUploaded = false; // flag ตรวจสอบการอัปโหลดไฟล์
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
    'คะแนนเก็บ',
    'คะแนนกลางภาค',
    'คะแนนปลายภาค',
  ]; // ฟีลด์ที่ต้องการ

  constructor(
    private fb: FormBuilder,
    private uploadScoreService: UploadScoreService,
    private userService: UserService
  ) {
    this.form = this.fb.group({
      // subjectNo: [''],
      // subjectName: [''],
      search: [{ value: '', disabled: false }],
      majorCode: [{ value: null, disabled: false }],
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
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // อ่านข้อมูลจาก Sheet แรก
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // แปลง Sheet เป็น JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        // ตรวจสอบฟีลด์
        if (this.validateFields(jsonData)) {
          // เพิ่มฟีลด์คะแนนรวม
          const modifiedData = this.processData(jsonData);

          // โหลดข้อมูลลงใน ag-Grid
          this.loadGridData(modifiedData);
          this.isFileUploaded = true; // ตั้งค่า flag เมื่อไฟล์อัปโหลดแล้ว
          this.isUploaded.emit(true); // แจ้ง Parent ว่าไฟล์ถูกอัปโหลดสำเร็จ
        } else {
          alert('ไฟล์ไม่ถูกต้อง กรุณาอัปโหลดไฟล์ที่มีฟีลด์ครบถ้วน');
        }
      };

      reader.readAsArrayBuffer(file);
    }
  }

  validateFields(data: any[]): boolean {
    if (data.length === 0) return false;
    const fileFields = Object.keys(data[0]); // ชื่อฟีลด์จากไฟล์ Excel
    return this.requiredFields.every((field) => fileFields.includes(field));
  }

  processData(data: any[]): any[] {
    return data.map((row) => {
      const [firstName, lastName] = (row['ชื่อ-นามสกุล'] || '').split(' '); // แยกชื่อและนามสกุล
      const totalScore =
        (row['คะแนนเก็บ'] || 0) +
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
        คะแนนเก็บ: row['คะแนนเก็บ'] || 0,
        คะแนนกลางภาค: row['คะแนนกลางภาค'] || 0,
        คะแนนปลายภาค: row['คะแนนปลายภาค'] || 0,
        คะแนนรวม: totalScore,
      };
    });
  }

  loadGridData(data: any[]) {
    if (data.length > 0) {
      console.log(data);
      // สร้างคอลัมน์จาก key ใน JSON
      this.columnDefs = Object.keys(data[0]).map((key) => {
        let customWidth = 100; // กำหนดความกว้างเริ่มต้น
        let flexValue = 1; // ค่าเริ่มต้นของ flex
        let cellClass = ''; // ตัวแปรสำหรับการกำหนดคลาส CSS
        switch (key) {
          case 'ลำดับ':
            customWidth = 71;
            flexValue = 0.8; // ความยืดหยุ่นเล็กกว่า
            break;
          case 'รหัสนิสิต':
            customWidth = 113;
            flexValue = 1.5; // ขยายความกว้าง
            break;
          case 'คำนำหน้า':
            customWidth = 88;
            flexValue = 1.2; // ขนาดปานกลาง
            break;
          case 'ชื่อ':
          case 'นามสกุล':
            customWidth = 161;
            flexValue = 1.8; // ขนาดปานกลาง
            break;
          case 'รหัสสาขา':
            customWidth = 90;
            flexValue = 1.2; // ขนาดปานกลาง
            break;
          case 'อีเมล':
            customWidth = 210;
            flexValue = 2; // ความกว้างมากที่สุด
            break;
          case 'คะแนนเก็บ':
            customWidth = 125;
            flexValue = 1.4; // ค่า flex เท่ากัน
            cellClass = 'text-end'; // เพิ่มคลาสสำหรับการจัดข้อความ
            break;
          case 'คะแนนกลางภาค':
            customWidth = 134;
            flexValue = 1.5; // ค่า flex เท่ากัน
            cellClass = 'text-end'; // เพิ่มคลาสสำหรับการจัดข้อความ
            break;
          case 'คะแนนปลายภาค':
            customWidth = 134;
            flexValue = 1.5; // ค่า flex เท่ากัน
            cellClass = 'text-end'; // เพิ่มคลาสสำหรับการจัดข้อความ
            break;
          case 'คะแนนรวม':
            customWidth = 126.6;
            flexValue = 1.3; // ค่า flex เท่ากัน
            cellClass = 'text-end'; // เพิ่มคลาสสำหรับการจัดข้อความ
            break;
          default:
            customWidth = 160; // ความกว้างเริ่มต้น
        }
        return {
          field: key,
          headerName: key.charAt(0).toUpperCase() + key.slice(1),
          flex: flexValue, // ใช้ flex แทน width
          minWidth: customWidth, // กำหนดความกว้างขั้นต่ำ
          // width: customWidth, // กำหนดความกว้าง
          cellClass: cellClass, // เพิ่มคลาส
        };
      });
      this.rowData = data;
      this.originalData = data;
      console.log(this.rowData);
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
        accumulated_score: item['คะแนนเก็บ'],
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
