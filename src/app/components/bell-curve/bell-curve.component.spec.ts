import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BellCurveComponent } from './bell-curve.component';

describe('BellCurveComponent', () => {
  let component: BellCurveComponent;
  let fixture: ComponentFixture<BellCurveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BellCurveComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BellCurveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
