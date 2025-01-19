import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UploadScoreService {
  private httpOptions = {
    headers: new HttpHeaders({
      'content-type': 'application/json;charset=UTF-8',
    }),
    responseType: 'json' as 'json',
  };

  constructor(private http: HttpClient) {}

  searchSubjects(
    term: string
  ): Observable<{ subjectCode: string; subjectName: string }[]> {
    if (!term.trim()) {
      // If the search term is empty, return an empty array.
      return of([]);
    }

    return this.getSubject().pipe(
      map((subjects) =>
        subjects.filter(
          (subject) =>
            subject.subjectCode.toLowerCase().includes(term.toLowerCase()) ||
            subject.subjectName.toLowerCase().includes(term.toLowerCase())
        )
      ),
      tap((filteredSubjects) =>
        console.log(
          `Filtered subjects based on term "${term}"`,
          filteredSubjects
        )
      )
    );
  }

  uploadScore(payload: any): Observable<any> {
    const url = `${environment.apiUrl}/api/StudentScore/UploadScore`;
    return this.http.post<any>(url, payload, { ...this.httpOptions }).pipe(
      map((response: any) => response),
      tap((_) => console.log('uploadScore done!!'))
    );
  }

  getSubject(): Observable<{ subjectCode: string; subjectName: string }[]> {
    const url = `${environment.apiUrl}/api/MasterData/Subject`;
    return this.http.get<any>(url, this.httpOptions).pipe(
      map((response: any) => {
        return response.objectResponse.map((subject: any) => ({
          subjectCode: subject.subject_id,
          subjectName: subject.subject_name,
        }));
      }),
      tap((_) => console.log(`get masterdata done!!`))
    );
  }
}