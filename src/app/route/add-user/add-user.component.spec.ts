import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUserRoute } from './add-user.component';

describe('AddUserRoute', () => {
  let component: AddUserRoute;
  let fixture: ComponentFixture<AddUserRoute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddUserRoute]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddUserRoute);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
