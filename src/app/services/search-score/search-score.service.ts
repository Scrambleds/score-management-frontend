import { Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class SearchScoreService {
    private httpOptions = {
      headers: new HttpHeaders({
        'content-type': 'application/json;charset=UTF-8',
      }),
      responseType: 'json' as 'json',
    };
  constructor(private http: HttpClient) {}

  getScoreAnnouncementByCondition(data: any): Observable<any> {
    const url = `${environment.apiUrl}/api/ScoreAnnoucement/GetScoreAnnoucementByCondition`;
    return this.http.post(url, data);
  }
    deleteScoreByCondition(template: any): Observable<any> {
      const url = `${environment.apiUrl}/api/ScoreAnnoucement/DeleteSubjectScoreByCondition`;
      return this.http.post<any>(url, template,{ ...this.httpOptions }).pipe(
        map((response: any) => response),
        tap((_) => console.log('Delete Score is done!!')));
    }
}
