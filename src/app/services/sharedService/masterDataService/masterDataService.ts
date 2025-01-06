import { Injectable } from "@angular/core";
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})

export class masterDataService{
    private roleData: any[] = [];
    private prefixData: any[] = [];
    private statusData: any[] = [];

    // ใช้ BehaviorSubject เพื่อแจ้งการเปลี่ยนแปลงข้อมูล
    private roleDataSubject = new BehaviorSubject<any[]>([]);
    private prefixDataSubject = new BehaviorSubject<any[]>([]);
    private statusDataSubject = new BehaviorSubject<any[]>([]);

    setMasterData(roleData: any[], prefixData: any[], statusData: any[]): void{
        this.roleData = roleData;
        this.prefixData = prefixData;
        this.statusData = statusData;

        // อัปเดตค่าใน BehaviorSubject
        this.roleDataSubject.next(this.roleData);
        this.statusDataSubject.next(this.statusData);
        this.prefixDataSubject.next(this.prefixData);
        console.log("Updated roleData: ", this.roleData);
        console.log("Updated statusData: ", this.statusData);
        console.log("Updated prefix : ", this.prefixData);
    }
    getRoleData(): any[]{
        return this.roleData;
    }
    getPrefixData(): any[]{
        return this.prefixData;
    }
    getStatusData(): any[]{
        return this.statusData;
    }

    // เพิ่ม Observable สำหรับติดตามการเปลี่ยนแปลงข้อมูล
    getRoleDataObservable() {
      return this.roleDataSubject.asObservable();
    }

    getPrefixDataObservable() {
      return this.prefixDataSubject.asObservable();
    }

    getStatusDataObservable() {
      return this.statusDataSubject.asObservable();
    }
  }