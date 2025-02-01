// import { Injectable } from '@angular/core';
// import {
//   CanActivate,
//   ActivatedRouteSnapshot,
//   RouterStateSnapshot,
//   Router,
// } from '@angular/router';
// import { JwtHelperService } from '@auth0/angular-jwt'

// @Injectable({
//   providedIn: 'root',
// })
// export class AuthGuard implements CanActivate {
//   constructor(private router: Router, private JwtHelperService: JwtHelperService) {}

//   canActivate(
//     route: ActivatedRouteSnapshot,
//     state: RouterStateSnapshot
//   ): boolean {
//     let token;
//     let userInfo;
//     let tokenExpiration;

//     if (typeof window !== 'undefined') {
//       token = localStorage.getItem('token');
//       userInfo = localStorage.getItem('userInfo');
//       tokenExpiration = localStorage.getItem('tokenExpiration');
//     }
//     if (token && tokenExpiration && new Date() < new Date(tokenExpiration)) {
//       localStorage.setItem('redirectPath', state.url); // Store the intended URL for redirection after login
//       return true;
//     } else {
//       if (typeof window !== 'undefined') {
//         localStorage.clear();
//         this.router.navigate(['/Login']);
//       }
//       return false;
//     }
//   }
// }

import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private jwtHelper: JwtHelperService) {}

  // ฟังก์ชันสำหรับดึง role ของผู้ใช้
  getUserRole(): string | null {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = this.jwtHelper.decodeToken(token);
      return decodedToken?.role || null;
    }
    return null;
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const token = localStorage.getItem('token') || false;
    const tokenExpiration = localStorage.getItem('tokenExpiration');
    const userInfo = localStorage.getItem('userInfo');
    // ตรวจสอบ token ว่ามีอยู่และยังไม่หมดอายุ
    if (!token || this.jwtHelper.isTokenExpired(token)) {
      this.router.navigate(['/Login']);
      localStorage.clear();
      return false;
    }

    const decodedToken = this.jwtHelper.decodeToken(token);
    const userRole = decodedToken?.role;
    const allowedRoles = route.data['allowedRoles'] as Array<number>;

    if (allowedRoles && !allowedRoles.includes(userRole)) {
      this.router.navigate(['/NotFound']);
      return false;
    }

    if (token && tokenExpiration && new Date() < new Date(tokenExpiration)) {
      // localStorage.setItem('redirectPath', state.url);
      // this.router.navigate([state.url]);
      return true;
    } else {
      localStorage.clear();
      this.router.navigate(['/Login']);
      return false;
    }
  }
}
