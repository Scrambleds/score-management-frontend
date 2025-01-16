import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SelectBoxService {
  private Url = `${environment.apiUrl}/api/MasterData/SystemParam`;

  constructor(private http: HttpClient) {}

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
}
