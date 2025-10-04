import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userInfoSubject = new BehaviorSubject<any>(null);
  userInfo$ = this.userInfoSubject.asObservable();

  constructor() {
    this.loadUserInfo();
  }

  updateRole(role: string): void {
    const userInfo = this.userInfoSubject.getValue();
    if (userInfo) {
      userInfo.role = role;
      this.userInfoSubject.next(userInfo);
    }
  }

  private loadUserInfo(): void {
    const userInfoJson = localStorage.getItem('userInfo');
    const userInfo = userInfoJson ? JSON.parse(userInfoJson) : null;
    this.userInfoSubject.next(userInfo);
  }

  updateUserInfo(userInfo: any): void {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    this.userInfoSubject.next(userInfo);
  }

  get username(): string {
    const userInfo = this.userInfoSubject.getValue();
    return userInfo ? userInfo.username : '';
  }

  get role(): number | null {
    const userInfo = this.userInfoSubject.getValue();
    return userInfo ? userInfo.role : null;
  }

  get teacherCode(): string {
    const userInfo = this.userInfoSubject.getValue();
    return userInfo ? userInfo.teacher_code : '';
  }

  get prefix(): string {
    const userInfo = this.userInfoSubject.getValue();
    return userInfo ? userInfo.prefix : '';
  }

  get firstname(): string {
    const userInfo = this.userInfoSubject.getValue();
    return userInfo ? userInfo.firstname : '';
  }

  get lastname(): string {
    const userInfo = this.userInfoSubject.getValue();
    return userInfo ? userInfo.lastname : '';
  }

  get email(): string {
    const userInfo = this.userInfoSubject.getValue();
    return userInfo ? userInfo.email : '';
  }

  get activeStatus(): string {
    const userInfo = this.userInfoSubject.getValue();
    return userInfo ? userInfo.active_status : '';
  }

  get prefixDescriptionTH(): string {
    const userInfo = this.userInfoSubject.getValue();
    return userInfo ? userInfo.prefix_description_th : '';
  }

  get roleDescriptionTH(): string {
    const userInfo = this.userInfoSubject.getValue();
    return userInfo ? userInfo.role_description_th : '';
  }
}
