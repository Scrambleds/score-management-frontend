import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslationService } from '../../core/services/translation.service';
import { UserService } from '../../services/sharedService/userService/userService.service';

@Component({
  selector: 'app-login-page',
  standalone: false,
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
})
export class LoginPageComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  loginForm: FormGroup;
  currentLang = '';
  constructor(
    private http: HttpClient,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private translationService: TranslationService,
    private UserService: UserService
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }
  isPasswordVisible: boolean = false;

  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  ngOnInit(): void {
    // Check token expiration on direct access to login page
    let token = '';
    let tokenExpiration = '';
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem(`language`) || 'th';
      this.currentLang = savedLang;
    }
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token') || '';
      tokenExpiration = localStorage.getItem('tokenExpiration') || '';
    }
    // const token = localStorage.getItem('token');
    // const tokenExpiration = localStorage.getItem('tokenExpiration');
    // const redirectUrl =
    //   this.activatedRoute.snapshot.queryParams['redirectUrl'] || '/Dashboard'; // Use activatedRoute
    let redirectUrl = '';
    if (token && tokenExpiration && new Date() < new Date(tokenExpiration)) {
      // const redirectPath = localStorage.getItem('redirectPath') || '/Dashboard';
      if (this.UserService.role !== null && this.UserService.role === 1) {
        redirectUrl = '/UserManagement';
      } else {
        redirectUrl = '/UploadScore';
      }
      this.router.navigate([redirectUrl]); // Redirect to a specific path if token is valid
    }
  }

  // usernameInput: string = ''; // เก็บค่าที่ผู้ใช้พิมพ์

  // onUsernameInput() {
  //   // เช็คว่าผู้ใช้พิมพ์แล้วมี @example.com ต่อท้ายหรือยัง
  //   const suffix = '@ku.th';
  //   if (!this.usernameInput.endsWith(suffix)) {
  //     // ถ้ายังไม่มี suffix ให้เติมต่อท้าย
  //     this.usernameInput = this.usernameInput + suffix;
  //   }
  // }
  async onLogin() {
    const loginData = {
      username: this.loginForm.value.username,
      password: this.loginForm.value.password,
    };

    try {
      const response: any = await this.http
        .post(`${environment.apiUrl}/api/User/GetToken`, loginData)
        .toPromise();

      if (response.isSuccess) {
        const token = response.tokenResult.token;
        const expiration = new Date(response.tokenResult.expiration);
        localStorage.setItem('token', token);
        localStorage.setItem('tokenExpiration', expiration.toISOString());

        const username = this.loginForm.value.username;
        await this.getUserInfo(username); // รอให้ getUserInfo เสร็จ

        let redirectUrl = '';
        console.log('Role:', this.UserService.role);

        if (this.UserService.role !== null && this.UserService.role === 1) {
          redirectUrl = '/UserManagement';
        } else {
          redirectUrl = '/UploadScore';
        }

        await this.router.navigate([redirectUrl]);
        console.log('Successfully navigated to:', redirectUrl);
      } else {
        this.errorMessage = response.message.messageKey;
      }
    } catch (error) {
      this.errorMessage = 'Login failed. Please try again.';
      console.error(error);
    }
  }

  // async onLogin() {
  //   const loginData = {
  //     username: this.loginForm.value.username,
  //     password: this.loginForm.value.password,
  //   };

  //   this.http
  //     .post(`${environment.apiUrl}/api/User/GetToken`, loginData)
  //     .subscribe(
  //       async (response: any) => {
  //         if (response.isSuccess) {
  //           const token = response.tokenResult.token;
  //           const expiration = new Date(response.tokenResult.expiration);
  //           localStorage.setItem('token', token);
  //           localStorage.setItem('tokenExpiration', expiration.toISOString());

  //           const username = this.loginForm.value.username;
  //           await this.getUserInfo(username);

  //           let redirectUrl = '';
  //           console.log('Role:', this.UserService.role);
  //           if (this.UserService.role == '1') {
  //             redirectUrl =
  //               this.activatedRoute.snapshot.queryParams['redirectUrl'] ||
  //               '/UserManagement';
  //           } else {
  //             redirectUrl =
  //               this.activatedRoute.snapshot.queryParams['redirectUrl'] ||
  //               '/UploadScore';
  //           }

  //           // Ensure NavigationEnd is triggered after successful login
  //           this.router.navigate([redirectUrl]).then(() => {
  //             // After navigating, the NavigationEnd event will be fired, and top-nav will receive it
  //             console.log('Successfully navigated to:', redirectUrl);
  //           });
  //         } else {
  //           this.errorMessage = response.message.messageKey;
  //         }
  //       },
  //       (error) => {
  //         this.errorMessage = 'Login failed. Please try again.';
  //       }
  //     );
  // }

  getUserInfo(username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Assuming you need to send the token in the Authorization header and username in the body
      const token = localStorage.getItem('token');
      if (token) {
        this.http
          .post(
            `${environment.apiUrl}/api/User/GetUserInfo`,
            { username: username }, // Send username in the request body
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
          .subscribe(
            (response: any) => {
              if (response.isSuccess) {
                localStorage.setItem(
                  'userInfo',
                  JSON.stringify(response.objectResponse)
                );
                console.log(
                  'User info stored in localStorage:',
                  response.objectResponse
                );
                const userInfo = response.objectResponse;
                const roleInfo = response.objectResponse.role;
                this.UserService.updateUserInfo(userInfo);
                this.UserService.updateRole(roleInfo);
                resolve(); // ให้ Promise เสร็จสิ้น
              } else {
                console.error(
                  'Failed to fetch user info:',
                  response.message.messageDescription
                );
                reject(response.message.messageDescription);
              }
            },
            (error) => {
              console.error('Error fetching user info:', error);
              reject(error);
            }
          );
      } else {
        reject('Token not found');
      }
    });
  }

  isTokenExpired(): boolean {
    const expiration = localStorage.getItem('tokenExpiration');
    if (expiration) {
      return new Date() > new Date(expiration);
    }
    return true;
  }

  changeLanguage(event: Event, lang: string): void {
    event.preventDefault(); // ป้องกันไม่ให้เกิดการ reload หน้า
    this.translationService.changeLanguage(lang); // ใช้ฟังก์ชันจาก TranslationService
    this.currentLang = lang; // อัปเดตภาษาปัจจุบัน
    localStorage.setItem('language', lang); // เก็บภาษาลงใน localStorage
  }
}
