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

  constructor(private fb: FormBuilder, private searchService: SearchMasterdataServiceTsComponent) {
    this.searchForm = this.fb.group({
      searchInput: ['']
    });
  }

  onInputChange(value: string): void {
    this.searchService.setSearchTerm(value.trim()); // ส่งค่าทันทีขณะพิมพ์
  }

  onSubmit(): void {
    const searchValue = this.searchForm.value.searchInput.trim();
    this.searchService.setSearchTerm(searchValue); // ส่งค่าค้นหาไปยัง Service
  }
  onReset(): void {
    this.searchForm.reset();
    this.searchService.setSearchTerm(''); // ล้างค่าค้นหา
  }
}