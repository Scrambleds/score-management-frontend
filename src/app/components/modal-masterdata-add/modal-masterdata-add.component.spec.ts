import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalMasterdataAddComponent } from './modal-masterdata-add.component';

describe('ModalMasterdataAddComponent', () => {
  let component: ModalMasterdataAddComponent;
  let fixture: ComponentFixture<ModalMasterdataAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalMasterdataAddComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalMasterdataAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});