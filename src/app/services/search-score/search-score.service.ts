import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class SearchScoreService {
  constructor(private http: HttpClient) {}

  getScoreAnnouncementByCondition(data: any): Observable<any> {
    const url = `${environment.apiUrl}/api/ScoreAnnoucement/GetScoreAnnoucementByCondition`;
    return this.http.post(url, data);
  }
}
