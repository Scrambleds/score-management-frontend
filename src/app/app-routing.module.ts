import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { AddUserRoute } from './route/add-user/add-user.component';
import { ChangePasswordComponent } from './route/change-password/change-password.component';
import { DashboardComponent } from './route/dashboard/dashboard.component';
import { LoginPageComponent } from './route/login-page/login-page.component';
import { MasterDataComponent } from './route/master-data/master-data.component';
import { ScoreAnnouncementComponent } from './route/score-announcement/score-announcement.component';
import { SearchScoreComponent } from './route/search-score/search-score.component';
import { UploadScoreComponent } from './route/upload-score/upload-score.component';
import { UserManageComponent } from './route/user-manage/user-manage.component';
import { Page404Component } from './components/page-404/page-404.component';
import { ErrorLayoutComponent } from './layout/error-layout/error-layout.component';

const routes: Routes = [
  {
    path: '',
    // component: ScoreAnnouncementComponent,
    // data: { messageKey: 'menu_scoreannounce' },
    redirectTo: '/Login', // กำหนดให้เปลี่ยนเส้นทางไปที่ ScoreAnnouncement
    pathMatch: 'full',
  },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'Login',
        component: LoginPageComponent,
      },
    ],
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'MasterData',
        component: MasterDataComponent,
        data: { messageKey: 'menu_masterdata', allowedRoles: ['1'] },
        canActivate: [AuthGuard],
      },
      {
        path: 'UserManagement',
        data: { messageKey: 'menu_usermanage', allowedRoles: ['1'] },
        canActivate: [AuthGuard],
        children: [
          {
            path: '',
            component: UserManageComponent, // ใช้ path หลักแสดง UserManageComponent
          },
          {
            path: 'AddUser', // path ย่อย
            component: AddUserRoute,
          },
        ],
      },
      {
        path: 'UploadScore',
        component: UploadScoreComponent,
        data: { messageKey: 'menu_uploadscore' },
        canActivate: [AuthGuard],
      },
      {
        path: 'SearchScore',
        component: SearchScoreComponent,
        data: { messageKey: 'menu_searchscore' },
        canActivate: [AuthGuard],
      },
      {
        path: 'ScoreAnnouncement',
        component: ScoreAnnouncementComponent,
        data: { messageKey: 'menu_scoreannounce' },
        canActivate: [AuthGuard],
      },
      {
        path: 'Dashboard',
        component: DashboardComponent,
        data: { messageKey: 'menu_dashboard' },
        canActivate: [AuthGuard],
      },
      {
        path: 'ChangePWD',
        component: ChangePasswordComponent,
        data: { messageKey: 'change_pwd_title' },
        canActivate: [AuthGuard],
      },
      // { path: 'NotFound', component: Page404Component, data: { messageKey: 'Page 404' }, },
      // { path: '**', redirectTo: '/NotFound' },
    ],
  },
  {
    path: 'NotFound',
    component: ErrorLayoutComponent,
    children: [
      {
        path: '**',
        canActivate: [AuthGuard],
        component: Page404Component,
        data: { messageKey: 'error_title' },
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/NotFound',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: false })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
