import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { passwordStrengthValidator } from '../validators/password-strength.validator';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-edit',
  standalone: false,
  templateUrl: './modal-edit.component.html',
  styleUrls: ['./modal-edit.component.css']
})
export class ModalEditComponent {
  @Input() show = false; // ควบคุมการแสดงผลของ modal
  // @Input() role: Array<{ id: string; title: string }> = []; 
  @Input() roleOptions: Array<{ id: string; title: string }> = [];
  @Input() statusOptions: Array<{ id: string; title: string }> = [];
  // @Input() active_status: Array<{ id: string; title: string }> = [];
  @Input() selectedRowData: any; 

  @Output() hide = new EventEmitter<void>(); // สัญญาณเมื่อปิด modal
  @Output() submit = new EventEmitter<any>(); // ส่งข้อมูล form กลับไปที่ parent เมื่อ submit

  form: FormGroup;
  isDisabled = true;
  submitted = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      row_id: [null],
      teacher_code: [{value: null , disabled: this.isDisabled}, Validators.required],
      email: [{value: null, disabled: this.isDisabled}, [Validators.required, Validators.email]],
      role: [null, Validators.required],
      prefix: [null, Validators.required],
      firstname: [null, Validators.required],
      lastname: [null, Validators.required],
      password: [null, [passwordStrengthValidator()]],
      active_status: [null, Validators.required],
    });

    // ฟังการเปลี่ยนแปลงในฟิลด์ password
    this.form.get('password')?.valueChanges.subscribe((password) => {
      if (password && password.trim() !== '') {
        this.addConditionalFields();
      } 
      // else if(password.trim() === ''){
      //   this.removeConditionalFields();
      // }
      else {
        this.removeConditionalFields();
      }
    });
  }

  // ฟังก์ชันตรวจสอบการตรงกันของ password และ confirm_password
  private matchPasswords: ValidatorFn = (control: AbstractControl) => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirm_password')?.value;

    if (!password || password.length < 8){
      return null;
    }
  
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true }; // ส่งข้อผิดพลาดเมื่อรหัสผ่านไม่ตรงกัน
    }
    return null; // ไม่มีข้อผิดพลาด
  };

  ngOnChanges() {
    if (this.selectedRowData) {
      this.form.patchValue({
        row_id: this.selectedRowData.row_id,
        teacher_code: this.selectedRowData.teacher_code,
        email: this.selectedRowData.email,
        role: this.selectedRowData.role,
        prefix: this.selectedRowData.prefix,
        firstname: this.selectedRowData.firstname,
        lastname: this.selectedRowData.lastname,
        active_status: this.selectedRowData.active_status,
      });
    }
  }

  ngOnInit() {
    // ฟังการเปลี่ยนแปลงของ password
    this.form.get('password')?.valueChanges.subscribe(() => {
      this.form.get('confirm_password')?.updateValueAndValidity();
    });
  
    // ฟังการเปลี่ยนแปลงของ confirm_password
    this.form.get('confirm_password')?.valueChanges.subscribe(() => {
      this.form.get('confirm_password')?.updateValueAndValidity();
    });
  }

  private addConditionalFields() {
    if (!this.form.contains('confirm_password')) {
      this.form.addControl('confirm_password', this.fb.control(null, Validators.required));
    }
  
    // ตั้งค่า matchPasswords validator ใน confirm_password
    this.form.get('confirm_password')?.setValidators([Validators.required, this.matchPasswords]);
    this.form.get('confirm_password')?.updateValueAndValidity(); // อัพเดตการตรวจสอบ
    this.form.updateValueAndValidity(); // อัพเดตฟอร์มทั้งหมด
  }

  private removeConditionalFields() {
    if (this.form.contains('confirm_password')) {
      this.form.removeControl('confirm_password');
      // this.form.clearValidators();
      this.form.setValidators(null);
    }
  }

  onHide() {
    this.hide.emit();
    this.form.reset();
    this.removeConditionalFields();
  }

  onSubmit() {
    this.submitted = true;
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (this.form.valid) {
      console.log("ฟอร์มถูกต้อง ข้อมูลที่ส่ง: ", this.form.getRawValue());
      this.submit.emit(this.form.value);

      Swal.fire({
        title: 'สำเร็จ',
        text: 'บันทึกข้อมูลเรียบร้อยแล้ว',
        icon: 'success',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#007bff'
        // showConfirmButton: false,
        // timer: 2000,
      });

      this.form.reset();
      this.removeConditionalFields();
    } else {
      console.log("ฟอร์มไม่ถูกต้อง ข้อผิดพลาด: ", this.form.errors);

      // Swal.fire({
      //   title: 'เกิดข้อผิดพลาด',
      //   text: 'กรุณากรอกข้อมูลให้ครบถ้วน',
      //   icon: 'error',
      //   confirmButtonText: 'ตกลง'
      //   // showConfirmButton: false,
      //   // timer: 2000,
      // });
    }
  }

  // onSubmit(){
  //   console.log(this.form.value);
  // }

  // ฟังก์ชันนี้ใช้ในการอัพเดต validation ของ confirm_password เมื่อออกจากฟิลด์
  onBlurConfirmPassword() {
    const confirmPasswordControl = this.form.get('confirm_password');
    confirmPasswordControl?.updateValueAndValidity(); // อัพเดตค่า validity
    confirmPasswordControl?.markAsTouched(); // ทำเครื่องหมายเป็น touched เพื่อแสดงข้อผิดพลาด
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: KeyboardEvent) {
    if (this.show) {
      this.onHide();
    }
  }
}
