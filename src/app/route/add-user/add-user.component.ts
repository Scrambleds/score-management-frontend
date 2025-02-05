import { Component } from '@angular/core';
import { AddUserComponent } from '../../components/add-user/add-user.component';
import { SearchCriteria } from '../../services/search-service/seach.service';

@Component({
  selector: 'app-add-user-route',
  standalone: false,
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css']
})
export class AddUserRoute {
  // rowData: any[] = [];
  rowData: SearchCriteria = {};
  originalData: any[] = [];

  onSearchEvent(criteria: SearchCriteria): void {
    // this.rowData = this.filterData(this.originalData, criteria);
    this.rowData = criteria;
  }
  
  // onSearchEvent(criteria: SearchCriteria): void {
  //   if (criteria) {
  //     this.rowData = this.filterData(this.originalData, criteria);
  //   } else {
  //     this.rowData = [...this.originalData]; // ถ้า criteria ไม่มีค่า ก็กำหนดให้เป็นข้อมูลเดิมทั้งหมด
  //   }
  // }

  // Filter function to filter rows based on search criteria
  private filterData(data: any[], criteria: SearchCriteria): any[] {
    return data.filter(item => {
      const searchString = criteria.fullname?.toLowerCase() || '';
      const fullName = `${item.prefix} ${item.firstname} ${item.lastname}`.toLowerCase();

      return (
        (!criteria.teacher_code || item.teacher_code?.includes(criteria.teacher_code)) &&
        (!criteria.email || item.email?.includes(criteria.email)) &&
        (!criteria.role || item.role === criteria.role) &&
        (!criteria.active_status || item.active_status === criteria.active_status) &&
        (!searchString || fullName.includes(searchString))
      );
    });
  }
}