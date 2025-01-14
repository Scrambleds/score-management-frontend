import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  dashboardData: any;
  cardValue: any;

  updateDashboardData(data: any) {
    this.dashboardData = data;
  }

  cardRequest(data: any){
    this.cardValue = data
  }
}
