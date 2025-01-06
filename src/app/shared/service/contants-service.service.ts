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

  
  getLovContant( req:any ): Observable<{ label: string; value: string;}[]> {
    const url = `${contantservice.apiUrl}/${req}`;
    return this.http.post<any>(url, {}).pipe(
      map((response) => {
        if (response.isSuccess && response.objectResponse) {
          return response.objectResponse.map((item: any) => ({
            label: item.byte_desc_th,
            value: item.byte_code,
          }));
        }
        return [];
      })
    );
  }


  getDataByCondition(req:any ,data: any): Observable<any> {
    const url = `${environment.apiUrl}/${req}`;
    return this.http.post(url, data);
  }
  
}
