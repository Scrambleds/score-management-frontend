import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SearchMasterdataServiceTsComponent } from '../../services/search-masterdata.service/search-masterdata.service.ts.component';

@Component({
  selector: 'app-search-master-data',
  standalone: false,
  
  templateUrl: './search-master-data.component.html',
  styleUrl: './search-master-data.component.css'
})
export class SearchMasterDataComponent {
  searchForm: FormGroup;
  isSearchTriggered = false;
  expandedReferences: Set<string> = new Set();

  constructor(private fb: FormBuilder, private searchService: SearchMasterdataServiceTsComponent) {
    this.searchForm = this.fb.group({
      searchInput: ['']
    });
  }

  onInputChange(value: string): void {
    const TrimValue = value ? value.trim() : '';
    console.log("Search term:", TrimValue);
    this.searchService.setSearchTerm(TrimValue); // ส่งค่าทันทีขณะพิมพ์
    
  }

  onSubmit(): void {
    const searchValue = this.searchForm.value.searchInput
    if (searchValue && searchValue.trim()) {
      this.isSearchTriggered = true; // อัปเดตสถานะเมื่อกด Search
      this.searchService.setSearchTerm(searchValue.trim());
    } else {
      // ถ้าไม่มีการกรอกข้อมูลให้แสดงข้อมูลทั้งหมด
      this.isSearchTriggered = false;
      this.searchService.setSearchTerm(''); // ล้างค่าค้นหา
    }
  }

  onReset(): void {
    this.searchForm.reset();
    this.isSearchTriggered = false;
    this.searchService.setSearchTerm(''); // ล้างค่าค้นหา
  }
}