import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableScoreSearchComponent } from './table-score-search.component';

describe('UploadExcelContainerComponent', () => {
  let component: TableScoreSearchComponent;
  let fixture: ComponentFixture<TableScoreSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TableScoreSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableScoreSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
