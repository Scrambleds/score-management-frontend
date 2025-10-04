import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { passwordStrengthValidator } from '../../components/validators/password-strength.validator';
import Swal from 'sweetalert2';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-change-password',
  standalone: false,

  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css',
})
export class ChangePasswordComponent {
  passwordForm: FormGroup;
  messageKey: string | null = null;

  isCurrentPasswordVisible = false;
  isNewPasswordVisible = false;
  isConfirmPasswordVisible = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private translate: TranslationService,
    private router: Router
  ) {
    this.passwordForm = this.fb.group(
      {
        password: ['', Validators.required],
        newPassword: ['', [Validators.required, passwordStrengthValidator()]],
        conNewPassword: ['', Validators.required],
      },
      { validator: this.passwordMatchValidator }
    );
  }
  ngOnInit() {
    this.passwordForm.get('conNewPassword')?.disable();
    this.passwordForm.get('newPassword')?.valueChanges.subscribe((value) => {
      const confirmPasswordControl = this.passwordForm.get('conNewPassword');
      if (value) {
        confirmPasswordControl?.enable(); // เปิดใช้งาน confirmPassword
      } else {
        confirmPasswordControl?.disable(); // ปิดใช้งาน confirmPassword
      }
    });
  }

  // ฟังก์ชัน toggle สำหรับแต่ละช่อง
  togglePasswordVisibility(field: string) {
    if (field === 'current') {
      this.isCurrentPasswordVisible = !this.isCurrentPasswordVisible;
    } else if (field === 'new') {
      this.isNewPasswordVisible = !this.isNewPasswordVisible;
    } else if (field === 'confirm') {
      this.isConfirmPasswordVisible = !this.isConfirmPasswordVisible;
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const oldPassword = form.get('password')?.value;
    const newPassword = form.get('newPassword')?.value;
    const conNewPassword = form.get('conNewPassword')?.value;
  
    if (oldPassword === newPassword) {
      return { sameAsOld: true }; // รหัสผ่านใหม่ห้ามเหมือนรหัสผ่านเก่า
    }
  
    if (newPassword !== conNewPassword) {
      return { mismatch: true }; // รหัสผ่านใหม่และยืนยันรหัสผ่านต้องตรงกัน
    }
  
    return null; 
  }
  

  onSubmit() {
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.valid) {
      const userInfo = localStorage.getItem('userInfo');
      const username = JSON.parse(userInfo!).username;
      const formData = { ...this.passwordForm.value, username };
      const title = this.translate.getTranslation(
        'alrt_pwd_change_confirm_title'
      );
      const text = this.translate.getTranslation(
        'alrt_pwd_change_confirm_sub_tile'
      );
      const confirmButtonText = this.translate.getTranslation('btn_ok');
      const cancelButtonText = this.translate.getTranslation('btn_cancel');
      // แสดง SweetAlert เพื่อยืนยันก่อนส่ง API
      Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--danger-color)',
        cancelButtonColor: 'var(--secondary-color)',
        confirmButtonText: confirmButtonText,
        cancelButtonText: cancelButtonText,
      }).then((result) => {
        if (result.isConfirmed) {
          // หากผู้ใช้กด Confirm ส่งคำขอ API
          this.authService.changePassword(formData).subscribe(
            (response) => {
              if (response.isSuccess) {
                // หากสำเร็จ เคลียร์ localStorage และไปหน้า Login
                const successTitle =
                  this.translate.getTranslation('msg_success_title');
                const success_desc =
                  this.translate.getTranslation('msg_success_desc');
                Swal.fire({
                  text: success_desc,
                  title: successTitle,
                  icon: 'success',
                  confirmButtonColor: '#0d6efd',
                }).then(() => {
                  localStorage.clear();
                  this.router.navigate(['/Login']);
                });
              } else {
                // หากไม่สำเร็จ แสดง messageKey และรีเซ็ตฟอร์ม
                this.messageKey =
                  response.message.messageKey || 'Unknown error occurred';
                this.passwordForm.reset();
              }
            },
            (error) => {
              // กรณี API มีปัญหา
              this.messageKey = 'Unable to change password. Please try again.';
              this.passwordForm.reset();
            }
          );
        }
      });
    }
  }
}
