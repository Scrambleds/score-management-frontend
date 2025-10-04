import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SelectBoxService {
  private Url = `${environment.apiUrl}/api/MasterData/SystemParam`;

  private httpOptions = {
      headers: new HttpHeaders({
        'content-type': 'application/json;charset=UTF-8',
      }),
      responseType: 'json' as 'json',
    };

  constructor(private http: HttpClient) {}

  getSubjectDashboard(teacherCode?: string): Observable<{ subjectCode: string; subjectName: string }[]> {
    const url = `${environment.apiUrl}/api/Dashboard/GetSubjectDashboard`;
    
    const body = { teacher_code: teacherCode }; // ส่ง teacher_code ผ่าน request body
  
    return this.http.post<any>(url, body, this.httpOptions).pipe(
      map((response: any) => {
        // เพิ่มการตรวจสอบก่อนที่จะ map ข้อมูล
        if (Array.isArray(response)) {
          return response.map((subject: any) => ({
            subjectCode: subject.subject_id,
            subjectName: subject.subject_name,
          }));
        } else {
          console.error('Invalid response format:', response);
          return []; // คืนค่าเป็น array ว่างถ้าไม่มีข้อมูลที่ต้องการ
        }
      }),
      tap((_) => console.log(`get masterdata done!!`))
    );
  }  

  getSystemParamScoreType(): Observable<any> {
    const params = new HttpParams().set('reference', 'score_type');
    return this.http.get<Record<string, string>>(this.Url, { params }).pipe(
      map((response: any) => response.objectResponse),
      tap((_) => console.log(`get masterdata : section done!!`))
    );
  }

  getSystemParamRole(role: string): Observable<any> {
    const params = new HttpParams().append('reference', role);

    return this.http.get<any>(this.Url, { params });
  }
  getSystemParamPrefix(prefix: string): Observable<any> {
    const params = new HttpParams().append('reference', prefix);

    return this.http.get<any>(this.Url, { params });
  }
  getSystemParamStatus(Status: string): Observable<any> {
    const params = new HttpParams().append('reference', Status);

    return this.http.get<any>(this.Url, { params });
  }
  getSystemParamSection(): Observable<any> {
    const params = new HttpParams().set('reference', 'section');
    return this.http.get<Record<string, string>>(this.Url, { params }).pipe(
      map((response: any) => response.objectResponse),
      tap((_) => console.log(`get masterdata : section done!!`))
    );
  }
  getSystemParamAcademicYear(): Observable<any> {
    const params = new HttpParams().set('reference', 'academic_year');
    return this.http.get<Record<string, string>>(this.Url, { params }).pipe(
      map((response: any) => response.objectResponse),
      tap((_) => console.log(`get masterdata : academic_year done!!`))
    );
  }
  getSystemParamSemester(): Observable<any> {
    const params = new HttpParams().set('reference', 'semester');
    return this.http.get<Record<string, string>>(this.Url, { params }).pipe(
      map((response: any) => response.objectResponse),
      tap((_) => console.log(`get masterdata : semester done!!`))
    );
  }
  getSystemParamMajor(): Observable<any> {
    const params = new HttpParams().set('reference', 'major_code');
    return this.http.get<Record<string, string>>(this.Url, { params }).pipe(
      map((response: any) => response.objectResponse),
      tap((_) => console.log(`get masterdata : major_code done!!`))
    );
  }
  getTeacher(): Observable<any> {
    const url = `${environment.apiUrl}/api/MasterData/Teacher`;
    return this.http.get<Record<string, string>>(url).pipe(
      map((response: any) => response.objectResponse),
      tap((_) => console.log(`get masterdata : Teacher done!!`))
    );
  }
}
