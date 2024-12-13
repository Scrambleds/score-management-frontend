import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-form-edit',
  standalone: false,
  templateUrl: './form-edit.component.html',
  styleUrl: './form-edit.component.css'
})
export class FormEditComponent {
  isModalVisible = false;
  selectedRowData: any = null;
  form: FormGroup;

  data = [
    {
      row_id: 1,
      email: 'Chatchai.ka@ku.th',
      teacher_code: 'REGXXXXXXX',
      prefix: 'ดร.',
      firstname: 'ฉัตรชัย',
      lastname: 'เกษมทวีโชค',
      role: '2',
      active_status: '1',
    },
    {
      row_id: 2,
      email: 'Rawee.si@ku.th',
      teacher_code: '6430250318',
      prefix: 'นาย',
      firstname: 'รวี',
      lastname: 'สินบำรุง',
      role: '1',
      active_status: '1',
    },
  ];

  // masterdata = {
  //   accounttype: [
  //     { id: '1', title: 'Individual' },
  //     { id: '2', title: 'Corporate' },
  //   ],
  //   saleType: [
  //     { id: '1', title: 'Retail' },
  //     { id: '2', title: 'Wholesale' },
  //   ],
  // };

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      citizenId: ['', [Validators.required, Validators.pattern(/^\d{13}$/)]],
      corpStatus: [null, Validators.required],
      saleTypeCode: [null, Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      console.log('Form Submitted', this.form.value);
    } else {
      console.log('Form is invalid');
    }
  }

  handleClickBtnDeleteData(value: any): void {
    console.log('Delete clicked for:', value);
    // Add delete handling logic here
  }

    // Parent Component
  roleOption = [{ id: '1', title: 'ผู้ดูแลระบบ' }, { id: '2', title: 'อาจารย์' }];
  statusOption = [{ id: '1', title: 'active' }, { id: '2', title: 'inactive' }];

  getRoleTitle(roleId: string): string {
    const role = this.roleOption.find(role => role.id === roleId);
    return role ? role.title : '';
  }

  // Method to get status title by id
  getStatusTitle(statusId: string): string {
    const status = this.statusOption.find(status => status.id === statusId);
    return status ? status.title : '';
  }

  openModal(row: any) {
    this.selectedRowData = { ...row }; // Create a copy to avoid direct mutation
    this.isModalVisible = true;
  }

  handleModalClose() {
    this.isModalVisible = false; // Hide modal
  }

  handleModalSubmit(updatedData: any) {
    console.log('Submitted Data:', updatedData);
    const index = this.data.findIndex(item => item.row_id === updatedData.row_id);
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...updatedData }; // Update the data array
    }
    this.isModalVisible = false;
  }
}