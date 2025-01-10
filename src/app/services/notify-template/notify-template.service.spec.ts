import { TestBed } from '@angular/core/testing';

import { NotifyTemplateService } from './notify-template.service';

describe('NotifyTemplateService', () => {
  let service: NotifyTemplateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotifyTemplateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
