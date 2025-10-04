import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserEditService } from './edit-user.service';

describe('EditUserComponent', () => {
  let component: UserEditService;
  let fixture: ComponentFixture<UserEditService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserEditService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserEditService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
