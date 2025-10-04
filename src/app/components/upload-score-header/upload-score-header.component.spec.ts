import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadScoreHeaderComponent } from './upload-score-header.component';

describe('UploadScoreHeaderComponent', () => {
  let component: UploadScoreHeaderComponent;
  let fixture: ComponentFixture<UploadScoreHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UploadScoreHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadScoreHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
