import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-error-layout',
  standalone: false,

  templateUrl: './error-layout.component.html',
  styleUrl: './error-layout.component.css',
})
export class ErrorLayoutComponent {
    isOpen: boolean = false;
    isLoginPage: boolean = false;
  
    constructor(private router: Router) {
      this.router.events.subscribe(() => {
        // ตรวจสอบเส้นทางปัจจุบัน
        this.isLoginPage = this.router.url === '/Login';
      });
    }
    toggleNav() {
      this.isOpen = !this.isOpen;
    }
  }