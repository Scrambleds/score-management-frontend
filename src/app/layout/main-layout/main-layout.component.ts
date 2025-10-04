import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  standalone: false,

  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {
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