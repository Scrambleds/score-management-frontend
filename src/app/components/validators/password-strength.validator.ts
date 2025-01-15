import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value || '';
    
    // ตรวจสอบว่ามีตัวอักษรภาษาอังกฤษและตัวเลข หรืออักขระพิเศษ
    // const hasEnglishAndSpecialCharacters = /^[a-zA-Z0-9!@#$%^&]+$/.test(value);
    const hasEnglishAndSpecialCharacters = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&]{8,}$/.test(value);
    
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasSpecialCharacter = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const hasMinLength = value.length >= 8;

    const errors: any = {};

    // ตรวจสอบว่าแต่ละเงื่อนไขครบถ้วนหรือไม่
    // if (!hasUpperCase) {
    //   errors.missingUpperCase = 'ต้องมีตัวอักษรพิมพ์ใหญ่';
    // }
    // if (!hasLowerCase) {
    //   errors.missingLowerCase = 'ต้องมีตัวอักษรพิมพ์เล็ก';
    // }
    // if (!hasSpecialCharacter) {
    //   errors.missingSpecialCharacter = 'ต้องมีอักขระพิเศษ';
    // }
    // if (!hasMinLength) {
    //   errors.minLength = 'ต้องมีอย่างน้อย 8 ตัวอักษร';
    // }
    // if (!hasEnglishAndSpecialCharacters) {
    //   errors.hasEnglishAndSpecialCharacters = "กรุณากรอกภาษาอังกฤษและตัวเลขเท่านั้น";
    // }
    if(  value.length == 0) {
      return null;
    }
    if (value.length < 8) {
      errors.errorMessage = "password_length_error";
    }
    
    else if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
      errors.errorMessage = "password_must_include_letters_numbers";
    }
    
    else if (!/^[A-Za-z\d!@#$%^&]*$/.test(value)) {
      errors.errorMessage = "password_invalid_special_characters";
    }
    
    // คืนค่าข้อผิดพลาดหรือ null ถ้าผ่านทุกเงื่อนไข
    return Object.keys(errors).length ? errors : null;
  };
}