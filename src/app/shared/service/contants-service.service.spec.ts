import { TestBed } from '@angular/core/testing';

import { ContantService } from './contants-service.service';

describe('ScoreAnnouncementService', () => {
  let service: ContantService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContantService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
