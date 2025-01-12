import { NgModule } from '@angular/core';
import {
  BrowserModule,
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AgGridModule } from 'ag-grid-angular';
import { AgGridAngular } from 'ag-grid-angular'; // Angular Data Grid Component
import { CommonModule } from '@angular/common';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditUserComponent } from './components/edit-user/edit-user.component';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  NgLabelTemplateDirective,
  NgOptionTemplateDirective,
  NgSelectComponent,
} from '@ng-select/ng-select';
import { MatSelectModule } from '@angular/material/select';
import { FormEditComponent } from './components/form-edit/form-edit.component';
import { SideNavComponent } from './layout/side-nav/side-nav.component';
import { TopNavComponent } from './layout/top-nav/top-nav.component';
import { FooterComponent } from './layout/footer/footer.component';
import { MasterDataComponent } from './route/master-data/master-data.component';
import { UserManageComponent } from './route/user-manage/user-manage.component';
import { SearchScoreComponent } from './route/search-score/search-score.component';
import { UploadScoreComponent } from './route/upload-score/upload-score.component';
import { ScoreAnnouncementComponent } from './route/score-announcement/score-announcement.component';
import { DashboardComponent } from './route/dashboard/dashboard.component';
import { AddUserRoute } from './route/add-user/add-user.component';

import {
  HTTP_INTERCEPTORS,
  HttpClientModule,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { TranslatePipe } from './shared/pipes/translate.pipe';
import { UploadScoreHeaderComponent } from './components/upload-score-header/upload-score-header.component';
import { UploadExcelContainerComponent } from './components/upload-excel-container/upload-excel-container.component';
import { ModalEditComponent } from './components/modal-edit/modal-edit.component';
import { LoginPageComponent } from './route/login-page/login-page.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { AutocompleteComponent } from './components/autocomplete/autocomplete.component';
import { RequiredMarkerDirective } from '../../src/app/components/required-marker/required-marker.directive';
import { AddUserComponent } from '../../src/app/components/add-user/add-user.component';
import { ModalSendMailComponent } from './components/modal-send-mail/modal-send-mail.component';
import { TranslateDropdownPipe } from './shared/pipes/translateDropdown.pipe';
import { CachingInterceptor } from './core/interceptors/caching.interceptor';
import { CacheService } from './core/services/cache.service';
import { MasterDataComponents } from '../../src/app/components/master-data/master-data.component';
import { ModalMasterdataEditComponent } from './components/modal-masterdata-edit/modal-masterdata-edit.component';
import { ModalMasterdataAddComponent } from './components/modal-masterdata-add/modal-masterdata-add.component';
import { SearchFormScoreAnnouncementComponent } from './components/score-announcement/search-form/search-form-search-form-score-announcemen.component';
import { TableScoreAnnouncementComponent } from './components/score-announcement/table-score-announcemen/table-score-announcemen.component';
import { SearchMasterDataComponent } from './components/search-master-data/search-master-data.component';
import { TableScoreSearchComponent } from './components/score-search/table-score-search/table-score-search.component';
import { SearchFormScoreComponent } from './components/score-search/search-form/search-form-score.component';
import { BellCurveComponent } from './components/bell-curve/bell-curve.component';
import { NgChartsModule } from 'ng2-charts';
import { SearchDashboardComponent } from './components/search-dashboard/search-dashboard.component';

@NgModule({
  declarations: [
    AppComponent,
    EditUserComponent,
    FormEditComponent,
    SideNavComponent,
    TopNavComponent,
    FooterComponent,
    MasterDataComponent,
    UserManageComponent,
    SearchScoreComponent,
    UploadScoreComponent,
    ScoreAnnouncementComponent,
    DashboardComponent,
    TranslatePipe,
    UploadScoreHeaderComponent,
    UploadExcelContainerComponent,
    ModalEditComponent,
    LoginPageComponent,
    MainLayoutComponent,
    AuthLayoutComponent,
    AutocompleteComponent,
    AddUserComponent,
    AddUserRoute,
    ModalSendMailComponent,
    TranslateDropdownPipe,
    MasterDataComponents,
    ModalMasterdataEditComponent,
    ModalMasterdataAddComponent,
    SearchScoreComponent,
    SearchFormScoreAnnouncementComponent,
    TableScoreAnnouncementComponent,
    SearchMasterDataComponent,
    SearchFormScoreComponent,
    TableScoreSearchComponent,
    BellCurveComponent,
    SearchDashboardComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AgGridModule,
    AgGridAngular,
    CommonModule,
    ReactiveFormsModule,
    SweetAlert2Module.forRoot(),
    NgIf,
    FormsModule,
    NgSelectModule,
    NgLabelTemplateDirective,
    NgOptionTemplateDirective,
    NgSelectComponent,
    MatSelectModule,
    RequiredMarkerDirective,
    NgChartsModule
  ],
  providers: [
    CacheService,
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CachingInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
