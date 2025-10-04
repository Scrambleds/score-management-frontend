import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchFormScoreAnnouncementComponent } from './search-form-search-form-score-announcemen.component';

describe('UploadScoreHeaderComponent', () => {
  let component: SearchFormScoreAnnouncementComponent;
  let fixture: ComponentFixture<SearchFormScoreAnnouncementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SearchFormScoreAnnouncementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchFormScoreAnnouncementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
