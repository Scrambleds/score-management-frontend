import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalMasterdataEditComponent } from './modal-masterdata-edit.component';

describe('ModalMasterdataEditComponent', () => {
  let component: ModalMasterdataEditComponent;
  let fixture: ComponentFixture<ModalMasterdataEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalMasterdataEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalMasterdataEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
