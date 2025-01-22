import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { of, Observable } from "rxjs";

@Injectable({
    providedIn: 'root',
  })
  export class GetUserService {
    constructor(private http: HttpClient) {}
  
    getUserInfo(username: string): Observable<any> {
      const token = localStorage.getItem('token');
      if (token) {
        return this.http.post(
          `${environment.apiUrl}/api/User/GetUserInfo`,
          { username: username },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
      return of(null); // หรือคืนค่าอื่นๆ ถ้าไม่มี token
    }
  }