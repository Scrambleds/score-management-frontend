import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterDataComponents } from './master-data.component';

describe('MasterDataComponents', () => {
  let component: MasterDataComponents;
  let fixture: ComponentFixture<MasterDataComponents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MasterDataComponents]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MasterDataComponents);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
