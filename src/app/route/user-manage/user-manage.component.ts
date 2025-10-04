import { Component, ViewChild } from '@angular/core';
import { AddUserComponent } from '../../components/add-user/add-user.component';

@Component({
  selector: 'app-user-manage',
  standalone: false,
  
  templateUrl: './user-manage.component.html',
  styleUrl: './user-manage.component.css'
})
export class UserManageComponent {
  @ViewChild(AddUserComponent) addUserComponent!: AddUserComponent; // Reference AddUserComponent

  onSearchEvent(criteria: any): void {
    console.log('Received search criteria:', criteria); 
    this.addUserComponent.updateCriteria(criteria); // ส่งข้อมูลไปยัง AddUserComponent
  }
}