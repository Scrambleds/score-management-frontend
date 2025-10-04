import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MasterDataService {
  private masterData: any[] = [];

  private baseUrl = `${environment.apiUrl}/api/SystemParam`;

  constructor(private http: HttpClient) {}

  getMasterData(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetSystemParam`);
  }
  updateSystemParam(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/UpdateSystemParam`, data);
  }

  insertSystemParam(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/InsertSystemParam`, data);
  }

  setMasterData(data: any[]): void {
    this.masterData = data; // เก็บข้อมูลลงใน service
  }

  gotMasterData(): any[] {
    return this.masterData;  // เรียกข้อมูลจาก service
  }
}