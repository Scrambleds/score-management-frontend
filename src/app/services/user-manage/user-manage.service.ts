import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserManageService {
  private apiUrl = `${environment.apiUrl}/api/EditUser/GetAllUser`;
  private usersSubject: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  public users$: Observable<any[]> = this.usersSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders | null {
    const token = localStorage.getItem('token');
    const tokenExpiration = localStorage.getItem('tokenExpiration');

    if (!token || !tokenExpiration) {
      console.error('Token or token expiration is missing');
      return null;
    }

    const expirationDate = new Date(tokenExpiration);
    if (new Date().getTime() > expirationDate.getTime()) {
      console.error('Token is expired');
      return null;
    }

    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // ดึงข้อมูลผู้ใช้
  getUsers(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    if (!headers) {
      return throwError(() => new Error('Authorization token is missing or invalid'));
    }

    console.log('Making request with headers:', headers);
    return this.http.get<any[]>(this.apiUrl, { headers, withCredentials: true }).pipe(
      catchError((error) => {
        console.error('Error occurred while fetching users:', error);
        return throwError(() => new Error('Failed to fetch users. Please try again.'));
      })
    );
  }

  // ฟังก์ชันในการอัปเดตข้อมูลผู้ใช้ที่ถูกจัดเก็บใน BehaviorSubject
  updateUsers(users: any[]): void {
    this.usersSubject.next(users);
  }
}