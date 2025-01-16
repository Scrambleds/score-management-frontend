import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

@Injectable({
    providedIn: 'root'
})
export class ExcelExportService{
    private apiUrl = `${environment.apiUrl}/api/ExcelCreate/CreateExcelScore`

    constructor(private http: HttpClient){ }

    getBase64Excel(data: any): Observable<any>{
        console.log('API URL:', this.apiUrl); 
        return this.http.post<any>(this.apiUrl, data);
    }
}