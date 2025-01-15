import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { userInfo } from 'os';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    let token;
    let userInfo;
    let tokenExpiration;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token');
      userInfo = localStorage.getItem('userInfo');
      tokenExpiration = localStorage.getItem('tokenExpiration');
    }
    if (token && tokenExpiration && new Date() < new Date(tokenExpiration)) {
      localStorage.setItem('redirectPath', state.url); // Store the intended URL for redirection after login
      return true;
    } else {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        this.router.navigate(['/Login']);
      }
      return false;
    }
  }
}
