import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchMasterDataComponent } from './search-master-data.component';

describe('SearchMasterDataComponent', () => {
  let component: SearchMasterDataComponent;
  let fixture: ComponentFixture<SearchMasterDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SearchMasterDataComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchMasterDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
