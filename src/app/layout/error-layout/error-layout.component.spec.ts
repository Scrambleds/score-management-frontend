import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorLayoutComponent } from './error-layout.component';

describe('MainLayoutComponent', () => {
  let component: ErrorLayoutComponent;
  let fixture: ComponentFixture<ErrorLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ErrorLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ErrorLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
