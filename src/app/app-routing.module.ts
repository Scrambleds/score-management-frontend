import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MasterDataComponent } from './route/master-data/master-data.component';
import { UserManageComponent } from './route/user-manage/user-manage.component';
import { ScoreAnnouncementComponent } from './route/score-announcement/score-announcement.component';
import { UploadScoreComponent } from './route/upload-score/upload-score.component';
import { SearchScoreComponent } from './route/search-score/search-score.component';
import { DashboardComponent } from './route/dashboard/dashboard.component';
import { LoginPageComponent } from './route/login-page/login-page.component';
import { AuthGuard } from './auth/auth.guard';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { AddUserRoute } from './route/add-user/add-user.component';

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
        data: { messageKey: 'menu_masterdata' },
        canActivate: [AuthGuard],
      },
      {
        path: 'UserManagement',
        component: UserManageComponent,
        data: { messageKey: 'menu_usermanage' },
        canActivate: [AuthGuard],
      },
      {
        path: 'UserManagement/AddUser',
        component: AddUserRoute,
        data: { messageKey: 'menu_usermanage' },
        canActivate: [AuthGuard],
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
    ],
  },
  {
    path: '**', // สำหรับเส้นทางที่ไม่พบให้ไปที่หน้า Login
    redirectTo: '/Login',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: false })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
