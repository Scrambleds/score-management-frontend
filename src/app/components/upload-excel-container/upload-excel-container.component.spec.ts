import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadExcelContainerComponent } from './upload-excel-container.component';

describe('UploadExcelContainerComponent', () => {
  let component: UploadExcelContainerComponent;
  let fixture: ComponentFixture<UploadExcelContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UploadExcelContainerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadExcelContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
