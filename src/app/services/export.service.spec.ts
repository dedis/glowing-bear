/**
 * Copyright 2017 - 2019  The Hyve B.V.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {TestBed, inject} from '@angular/core/testing';
import {ExportService} from './export.service';
import {ConstraintService} from './constraint.service';
import {ConstraintServiceMock} from './mocks/constraint.service.mock';
import {ResourceService} from './resource.service';
import {ResourceServiceMock} from './mocks/resource.service.mock';
import {DataTableService} from './data-table.service';
import {DataTableServiceMock} from './mocks/data-table.service.mock';
import {ExportJob} from '../models/export-models/export-job';
import {AuthenticationService} from './authentication/authentication.service';
import {AuthenticationServiceMock} from './mocks/authentication.service.mock';
import {StudyService} from './study.service';
import {StudyServiceMock} from './mocks/study.service.mock';
import {Observable} from 'rxjs';
import {AppConfig} from '../config/app.config';
import {AppConfigMock, AppConfigSurveyExportMock} from '../config/app.config.mock';
import {VariableService} from './variable.service';
import {VariableServiceMock} from './mocks/variable.service.mock';
import {CountServiceMock} from './mocks/count.service.mock';
import {CountService} from './count.service';

describe('ExportService', () => {
  let exportService: ExportService;
  let resourceService: ResourceService;
  let exportJob: ExportJob;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AppConfig,
          useClass: AppConfigMock
        },
        {
          provide: ConstraintService,
          useClass: ConstraintServiceMock
        },
        {
          provide: ResourceService,
          useClass: ResourceServiceMock
        },
        {
          provide: AuthenticationService,
          useClass: AuthenticationServiceMock
        },
        {
          provide: StudyService,
          useClass: StudyServiceMock
        },
        {
          provide: DataTableService,
          useClass: DataTableServiceMock
        },
        {
          provide: CountService,
          useClass: CountServiceMock
        },
        {
          provide: VariableService,
          useClass: VariableServiceMock
        },
        ExportService
      ]
    });
    resourceService = TestBed.get(ResourceService);
    exportService = TestBed.get(ExportService);
    exportJob = new ExportJob();
    exportJob.id = 'id';
    exportJob.name = 'test job name';
  });

  it('should be injected', inject([ExportService], (service: ExportService) => {
    expect(service).toBeTruthy();
  }));

  it('should cancel export job', () => {
    let spy = spyOn(resourceService, 'cancelExportJob').and.callThrough();
    let spy1 = spyOn(exportService, 'updateExportJobs').and.callThrough();
    exportService.cancelExportJob(exportJob)
      .then(() => {
        expect(spy).toHaveBeenCalled();
        expect(spy1).toHaveBeenCalled();
      })
      .catch(err => {
        fail('should have succeeded canceling export job but failed');
      });
  })

  it('should handle error when canceling export job', () => {
    let spy = spyOn(resourceService, 'cancelExportJob').and.callFake(() => {
      return Observable.throwError('');
    });
    let spy1 = spyOn(exportService, 'updateExportJobs').and.callThrough();
    exportService.cancelExportJob(exportJob)
      .then(() => {
        fail('should have been handling error rather than succeeding in canceling export job');
      })
      .catch(err => {
        expect(spy).toHaveBeenCalled();
        expect(spy1).not.toHaveBeenCalled();
      })
  });

  it('should archive export job', () => {
    let spy = spyOn(resourceService, 'archiveExportJob').and.callThrough();
    let spy1 = spyOn(exportService, 'updateExportJobs').and.callThrough();
    exportService.archiveExportJob(exportJob)
      .then(() => {
        expect(spy).toHaveBeenCalled();
        expect(spy1).toHaveBeenCalled();
      })
      .catch(err => {
        fail('should have succeeded archiving export job but failed');
      });
  });

  it('should handle error when archiving export job', () => {
    let spy = spyOn(resourceService, 'archiveExportJob').and.callFake(() => {
      return Observable.throwError('');
    });
    let spy1 = spyOn(exportService, 'updateExportJobs').and.callThrough();
    exportService.archiveExportJob(exportJob)
      .then(() => {
        fail('should have been handling error rather than succeeding in archiving export job');
      })
      .catch(err => {
        expect(spy).toHaveBeenCalled();
        expect(spy1).not.toHaveBeenCalled();
      })
  });

  it('should update export jobs', () => {
    let spy = spyOn(resourceService, 'getExportJobs').and.callThrough();
    exportService.updateExportJobs()
      .then(() => {
        expect(spy).toHaveBeenCalled();
      })
      .catch(err => {
        fail('should have succeeded archiving export job but failed');
      });
  });

  it('should handle error when updating export jobs', () => {
    let spy = spyOn(resourceService, 'getExportJobs').and.callFake(() => {
      return Observable.throwError('');
    });
    exportService.updateExportJobs()
      .then(() => {
        fail('should have been handling error rather than succeeding in updating export jobs');
      })
      .catch(err => {
        expect(spy).toHaveBeenCalled();
      })
  });
});

describe('ExportService with surveyTable', () => {
  let exportService: ExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AppConfig,
          useClass: AppConfigSurveyExportMock
        },
        {
          provide: ConstraintService,
          useClass: ConstraintServiceMock
        },
        {
          provide: ResourceService,
          useClass: ResourceServiceMock
        },
        {
          provide: AuthenticationService,
          useClass: AuthenticationServiceMock
        },
        {
          provide: StudyService,
          useClass: StudyServiceMock
        },
        {
          provide: DataTableService,
          useClass: DataTableServiceMock
        },
        {
          provide: CountService,
          useClass: CountServiceMock
        },
        {
          provide: VariableService,
          useClass: VariableServiceMock
        },
        ExportService
      ]
    });
    exportService = TestBed.get(ExportService);
  });

  it('should be injected', inject([ExportService], (service: ExportService) => {
    expect(service).toBeTruthy();
  }));

  it('should properly set surveyTable flag', () => {
    expect(exportService.isTransmartSurveyTable).toEqual(true);
  });

});
