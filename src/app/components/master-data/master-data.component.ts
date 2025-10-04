import { Modal } from 'bootstrap';
import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
// import { FormSelectComponent } from './form-select.component';
// import { FormOpportunityComponent } from './form-opportunity.component';
import { ModalMasterdataEditComponent } from '../../components/modal-masterdata-edit/modal-masterdata-edit.component'
import { MasterDataService } from '../../services/master-data/master-data.service';
import { response } from 'express';
import { masterDataService } from '../../services/sharedService/masterDataService/masterDataService';
import { SelectBoxService } from '../../services/select-box/select-box.service';
import { forkJoin } from 'rxjs';
import { SearchMasterdataServiceTsComponent } from '../../services/search-masterdata.service/search-masterdata.service.ts.component';
import { Subscription } from 'rxjs';
import { isBuffer } from 'node:util';
import { match } from 'node:assert';

interface ByteDetail {
  byte_code: string;
  byte_desc_th: string;
  byte_desc_en: string;
  create_date: string;
  active_status: string;
}

interface MasterData {
  byte_reference: string;
  byteDetail: ByteDetail[];
}

@Component({
  selector: 'app-master-data',
  standalone: false,

  templateUrl: './master-data.component.html',
  styleUrl: './master-data.component.css'
})
export class MasterDataComponents implements OnInit {
  // form!: FormGroup;
  selectedDetail: any;
  @Input() options: any[] = [];
  openCollapse: number | null = null;
  // showOpportunityModal = false;
  modalElement: any;
  modalInstance: any;
  showModal = false;
  showAddModal = false;
  showEditModal = false;
  isModalVisible = false;
  isSearchTriggered = false;
  selectedByteReference: string | null = null;
  selectedByteCode: string | null = null;
  selectedByteDescTH: string | null = null;
  selectedByteDescEN: string | null = null;
  selectedActiveStatus: string | null = null;
  roleData: any[] = [];
  prefixData: any[] = [];
  statusData: any[] = [];

  searchSubscription!: Subscription;
  filteredData: MasterData[] = [];
  allMasterData: MasterData[] = [];
  data: {
    masterData: MasterData[]
  } = {
      masterData: []
    };

  constructor(private fb: FormBuilder, private MasterDataService: MasterDataService, private masterDataService: masterDataService,
    private SelectBoxService: SelectBoxService, private searchService: SearchMasterdataServiceTsComponent) { }

  ngOnInit(): void {
    // this.form = this.fb.group({});
    this.getMasterData();

    this.searchSubscription = this.searchService.searchTerm$.subscribe(term => {
      this.isSearchTriggered = !!term;
      this.filterMasterData(term);
    });

    const role = 'role';
    const prefix = 'prefix';
    const status = 'active_status';

    // Fetch role, prefix, and status data
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
  }

  ngOnDestroy(): void {
    this.searchSubscription.unsubscribe(); // ป้องกัน Memory Leak
  }

  onMasterDataUpdated(updatedItem: any) {
    this.allMasterData = this.allMasterData.map(item => {
      if (item.byte_reference === updatedItem.byte_reference) {
        return {
          ...item,
          byteDetail: item.byteDetail.map(detail =>
            detail.byte_code === updatedItem.byte_code ? { ...detail, ...updatedItem } : detail
          )
        };
      }
      return item;
    });

    this.filteredData = [...this.allMasterData];
  }

  onMasterDataAdded(newItem: any) {
    let existingMasterData = this.allMasterData.find(item => item.byte_reference === newItem.byte_reference);

    if (existingMasterData) {
      existingMasterData.byteDetail.push(newItem);
    } else {
      this.allMasterData.push({
        byte_reference: newItem.byte_reference,
        byteDetail: [newItem]
      });
    }

    this.filteredData = [...this.allMasterData];
  }

  filterMasterData(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredData = [...this.allMasterData];
      this.openCollapse = null;
    } else {
      this.filteredData = this.allMasterData.filter((item, index) => {
        const match =
        item.byte_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.byteDetail.some(detail => {
          const thMatch = detail.byte_desc_th.toLowerCase().includes(searchTerm.toLowerCase());
          const enMatch = detail.byte_desc_en.toLowerCase().includes(searchTerm.toLowerCase());
          console.log(`Searching!!!: ${searchTerm}, byte_desc_th: ${detail.byte_desc_th}, byte_desc_en: ${detail.byte_desc_en}`);
          console.log(`Searching: ${searchTerm}, byte_desc_th: ${detail.byte_desc_th}, byte_desc_en: ${detail.byte_desc_en}, thMatch: ${thMatch}, enMatch: ${enMatch}`);
          console.log(`Match found for: ${searchTerm}, opening collapse-${index}`);
          return thMatch || enMatch;
        });
      
      console.log(`Match found for: ${searchTerm}: ${match}`);      

      if (match) {
        this.openCollapse = 0;
        console.log("My Collaspe: ", this.openCollapse);
        setTimeout(() => {
          const element = document.getElementById(`collapse-${this.openCollapse}`);
          if (element) {
            console.log(`Scrolling to collapse-${this.openCollapse}`);
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      }      
        return match;
      });

     // ถ้ามีแค่ข้อมูลเดียวที่ตรงกัน (filteredData.length === 1)
     if (this.filteredData.length === 1) {
      this.openCollapse = 0;
      console.log("My Collaspe: ", this.openCollapse);
    } else {
      // ถ้ามีข้อมูลซ้ำกันในรายการอื่นๆ ไม่ต้อง expand
      const uniqueMatches = new Set(this.filteredData.map(item => item.byte_reference));
      if (uniqueMatches.size === 1) {
        this.openCollapse = 0; // ถ้ามีข้อมูลเดียวก็ขยายที่ 0
      } else {
        this.openCollapse = null; // ถ้ามีข้อมูลซ้ำกันก็ไม่ขยาย
      }
    }

    // สั่ง scroll ไปที่ collapse ถ้ามีการขยาย
    if (this.openCollapse !== null) {
      setTimeout(() => {
        const element = document.getElementById(`collapse-${this.openCollapse}`);
        if (element) {
          console.log(`Scrolling to collapse-${this.openCollapse}`);
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }
  // console.log('Filtered Data:', this.filteredData);
}

  getMasterData(): void {
    this.MasterDataService.getMasterData().subscribe(
      (response: any) => {
        if (response.isSuccess) {
          this.allMasterData = response.data.masterData; // เก็บข้อมูลต้นฉบับ
          this.filteredData = [...this.allMasterData]; // โหลดข้อมูลตอนเริ่มต้น
        }
      },
      (error) => {
        console.error('Error fetching master data:', error);
      }
    );
  }

  toggleCollapse(index: number): void {
    if (this.openCollapse === index) {
      this.openCollapse = null;
    } else {
      this.openCollapse = index;
    }
  }

  onAddModalChange = (show: boolean) => {
    this.showAddModal = show;
  }

  onEditModalChange = (show: boolean) => {
    this.showEditModal = show;
  }

  openAddModal = (byteReference: string, byteDetail: ByteDetail[]): void => {
    this.selectedByteReference = byteReference;
    this.selectedByteCode = this.getMaxByteCode(byteDetail);
    this.showAddModal = true;
  }

  openEditModal(byteReference: string, byteCode: string, byteDescTH: string, byteDescEN: string, activeStatus: string): void {
    console.log('openEditModal called with:', byteReference, byteCode, byteDescTH, byteDescEN, activeStatus);
    this.selectedByteReference = byteReference;
    this.selectedByteCode = byteCode;
    this.selectedByteDescTH = byteDescTH;
    this.selectedByteDescEN = byteDescEN;
    this.selectedActiveStatus = activeStatus;

    this.showEditModal = true;
    console.log('showEditModal:', this.showEditModal);
  }

  closeEditModal = () => {
    this.showEditModal = false;
  }

  closeAddModal = () => {
    this.showAddModal = false;
  }

  getMaxByteCode = (byteDetail: ByteDetail[]): string => {
    if (!byteDetail || byteDetail.length === 0) {
      return '1';
    }

    const maxByteCode = Math.max(...byteDetail.map(detail => parseInt(detail.byte_code, 10) || 0));
    return (maxByteCode + 1).toString();
  }

  ngAfterViewInit() {
    this.modalElement = document.querySelector('.modal');
    this.modalInstance = new Modal(this.modalElement);
  }
}