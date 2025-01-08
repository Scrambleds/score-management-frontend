import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchFormScoreComponent } from './search-form-score.component';

describe('UploadScoreHeaderComponent', () => {
  let component: SearchFormScoreComponent;
  let fixture: ComponentFixture<SearchFormScoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SearchFormScoreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchFormScoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
