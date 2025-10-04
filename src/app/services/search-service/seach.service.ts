import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// ประกาศ interface สำหรับ SearchCriteria
export interface SearchCriteria {
  teacher_code?: string;
  fullname?: string;
  email?: string;
  role?: string;
  active_status?: string;
  prefix?: string;
  firstname?: string;
  lastname?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private searchCriteriaSource = new BehaviorSubject<SearchCriteria | null>(
    null
  );
  currentSearchCriteria = this.searchCriteriaSource.asObservable();

  // Method สำหรับอัพเดตข้อมูล search criteria
  updateSearchCriteria(criteria: SearchCriteria) {
    this.searchCriteriaSource.next(criteria);
  }
}
