import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableScoreAnnouncementComponent } from './table-score-announcemen.component';

describe('UploadExcelContainerComponent', () => {
  let component: TableScoreAnnouncementComponent;
  let fixture: ComponentFixture<TableScoreAnnouncementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TableScoreAnnouncementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableScoreAnnouncementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
