import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalSendMailComponent } from './modal-send-mail.component';

describe('ModalSendMailComponent', () => {
  let component: ModalSendMailComponent;
  let fixture: ComponentFixture<ModalSendMailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalSendMailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalSendMailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
