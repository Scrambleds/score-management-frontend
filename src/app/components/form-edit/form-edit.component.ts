import { Component, OnInit, AfterViewInit, Input, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Modal } from 'bootstrap';
import { SearchService } from '../../services/search-service/seach.service';
import { Router } from '@angular/router';
import { UserManageService } from '../../services/user-manage/user-manage.service';
import { HttpResponseBase } from '@angular/common/http';
import { SelectBoxService } from '../../services/select-box/select-box.service';
import { masterDataService } from '../../services/sharedService/masterDataService/masterDataService';
import { forkJoin } from 'rxjs';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-form-edit',
  standalone: false,
  templateUrl: './form-edit.component.html',
  styleUrls: ['./form-edit.component.css'],
})
export class FormEditComponent implements OnInit, AfterViewInit {
  isUploadExcelVisible = false;
  isModalVisible = false;
  isSearchTriggered = false; 
  @Input() searchEvent!: EventEmitter<boolean>;
  selectedRowData: any = null;
  modalElement: any;
  modalInstance: any;
  searchCriteria: any;
  originalData: any[] = [];
  filteredData: any[] = [];
  roleData: any[] = [];
  prefixData: any[] = [];
  statusData: any[] = [];
  allMasterData: any[] = [];

  pagedData: any[] = []; // ข้อมูลเฉพาะหน้าปัจจุบัน
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  totalPagesArray: number[] = [];

  form: FormGroup;

  constructor(
    private UserManageService: UserManageService,
    private searchService: SearchService,
    private fb: FormBuilder,
    private router: Router,
    private SelectBoxService: SelectBoxService,
    private masterDataService: masterDataService,
    private searchTranslateService: TranslationService,
  ) {
    this.form = this.fb.group({
      teacher_code: ['', Validators.required],
      fullname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      active_status: ['', Validators.required],
    });
  }

  public updatePagination() {
    // คำนวณจำนวนหน้า
    this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
    this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  
    // แบ่งข้อมูลตามหน้าและขนาดหน้าจอ (แสดง 10 แถวต่อหน้า)
    this.pagedData = this.filteredData.slice(
      (this.currentPage - 1) * this.pageSize,
      this.currentPage * this.pageSize
    );
  }
  
  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();  // อัพเดตข้อมูลหน้าใหม่
    }
  }

  onAddUserClick() {
    this.router.navigate(['UserManagement/AddUser']);
  }

  customSearchFn_SearchLan(term: string, item: any): boolean {
    return this.searchTranslateService.searchFn(term, item);
  }

  // รับข้อมูลจาก searchService
  ngOnInit() {
    const role = 'role';
    const prefix = 'prefix';
    const status = 'active_status';
  
    // เรียก API เพื่อดึงข้อมูลจาก server
    this.UserManageService.getUsers().subscribe({
      next: (response: any) => {
        if (response.isSuccess) {
          this.originalData = response.objectResponse;
          this.filteredData = [...this.originalData];
          this.updatePagination();
          console.log('MY DATA', this.filteredData);
        } else {
          console.error('Failed to fetch data', response.message);
        }
      },
      error: (err) => {
        console.error('API Error:', err);
      },
    });

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
  
        this.masterDataService.setMasterData(this.roleData, this.prefixData, this.statusData);
      },
      error: (err: any) => {
        console.log('Error fetching master data: ', err);
      },
    });
  
    this.searchService.currentSearchCriteria.subscribe((criteria) => {
      this.isSearchTriggered = !! criteria;
      this.searchCriteria = criteria;
  
      if (this.searchCriteria) {
        this.filteredData = this.filterData(this.originalData, this.searchCriteria);
      } else {
        this.filteredData = [...this.originalData];
      }

      this.updatePagination();
    });
  }
  
  handleModalSubmit(updatedData: any) {
    console.log('Submitted Data:', updatedData);
    const index = this.filteredData.findIndex(
      (item) => item.row_id === updatedData.row_id
    );
    if (index !== -1) {
      this.filteredData[index] = {
        ...this.filteredData[index],
        ...updatedData,
      };
  
      this.UserManageService.updateUsers(this.filteredData);
    }
    this.closeModal();
  }
  
  // ฟังก์ชันการฟิลเตอร์ข้อมูลตาม criteria
  filterData(data: any[], criteria: any): any[] {
    return data.filter((item) => {
      const searchString = criteria.fullname?.toLowerCase() || '';
      return (
        (!criteria.teacher_code ||
          item.teacher_code?.includes(criteria.teacher_code)) &&
        (!criteria.email || item.email?.includes(criteria.email)) &&
        (!criteria.role || item.role === criteria.role) &&
        (!criteria.active_status ||
          item.active_status === criteria.active_status) &&
        (!searchString || this.matchAnyField(searchString, item)) // เปลี่ยนการค้นหาตาม fullname ทั้งหมด
      );
    });
  }

  toggleUploadExcel(): void {
    this.isUploadExcelVisible = !this.isUploadExcelVisible; // Toggle การแสดงผล
  }

  handleFileUpload(data: any): void {
    console.log('Data uploaded:', data);
    this.filteredData = [...this.filteredData, ...data];
    this.isUploadExcelVisible = false;
  }

  // ฟังก์ชันในการค้นหาข้อมูลในทุกๆ ฟิลด์
  matchAnyField(searchString: string, item: any): boolean {
    const lowerCaseSearchString = searchString.toLowerCase();

    // รวม prefix, firstname, lastname และทำการค้นหาคำในทุกฟิลด์
    const fullName =
      `${item.prefix} ${item.firstname} ${item.lastname}`.toLowerCase();
    return fullName.includes(lowerCaseSearchString);
  }

  onSubmit(): void {
    if (this.form.valid) {
      console.log('Form Submitted', this.form.value);
    } else {
      console.log('Form is invalid');
    }
  }

  getRoleTitle(roleId: string): string {
    const role = this.roleData.find(
      (role) => String(role.byte_desc_th) === String(roleId)
    );
    return role ? role.byte_desc_th : '';
  }

  getStatusTitle(statusId: string): string {
    const status = this.statusData.find(
      (status) => String(status.byte_desc_en) === String(statusId)
    );
    return status ? status.byte_desc_en : '';
  }

  getPrefixTitle(prefixId: string): string {
    const prefix = this.prefixData.find(
      (prefix) => String(prefix.byte_desc_th) === String(prefixId)
    );
    return prefix ? prefix.byte_desc_th : '';
  }

  // เปิด Modal
  openModal(row: any) {
    this.selectedRowData = { ...row };
    this.isModalVisible = true;
    if (this.modalInstance) {
      this.modalInstance.show();
    }
  }

  // ปิด Modal
  closeModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
    this.isModalVisible = false;
  }

  handleModalClose() {
    this.closeModal();
  }

  ngAfterViewInit() {
    this.modalElement = document.querySelector('.modal');
    this.modalInstance = new Modal(this.modalElement);
  }
}