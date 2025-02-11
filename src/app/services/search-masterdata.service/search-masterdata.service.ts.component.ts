import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})

export class SearchMasterdataServiceTsComponent {
  private searchTerm = new BehaviorSubject<string>('');
  searchTerm$ = this.searchTerm.asObservable();

  setSearchTerm(term: string) {
    this.searchTerm.next(term);
    this.searchTerm$.subscribe(term => {
      console.log("Filtered term received in subscription:", term);
    });    
  }
}