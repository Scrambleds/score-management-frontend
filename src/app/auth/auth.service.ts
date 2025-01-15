import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  constructor(private http: HttpClient) {}

  changePassword(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/User/ChangePWD`, data);
  }
}
