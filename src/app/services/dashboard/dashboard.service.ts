import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private apiUrl = `${environment.apiUrl}/api/Dashboard/GetDashboardStats`;

  private apiUrl_admin = `${environment.apiUrl}/api/Dashboard/GetDashboardTable`;

  constructor(private http: HttpClient) { }

  getDashboardStats(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }  

  getTableData(data: any): Observable<any[]> {
    return this.http.post<any[]>(this.apiUrl_admin, data);
  }
}