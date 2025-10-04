import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { contantservice, environment } from '../../../environments/environment';
import { map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ContantService {
  private httpOptions = {
    headers: new HttpHeaders({
      'content-type': 'application/json;charset=UTF-8',
    }),
    responseType: 'json' as 'json',
  };
  valueChanges: any;

  constructor(private http: HttpClient) {}

  // contantLovService.ts
getLovContant(req: string): Observable<{ desc_th: string; desc_en: string; placeholder_key: string }[]> {
  const url = `${contantservice.apiUrl}/${req}`;
  return this.http.post<any>(url, {}).pipe(
    map(response => {
      if (response.isSuccess && response.objectResponse) {
        return response.objectResponse.map((item: any) => ({
          desc_th: item.byte_desc_th,
          desc_en: item.byte_desc_en,
          placeholder_key: item.byte_code,
        }));
      }
      return [];
    })
  );
}


  getDataByCondition(req: any, data: any): Observable<any> {
    const url = `${environment.apiUrl}/${req}`;
    return this.http.post(url, data);
  }
}
