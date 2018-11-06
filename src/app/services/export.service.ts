/**
 * Copyright 2017 - 2018  The Hyve B.V.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {Injectable, Injector} from '@angular/core';
import {ExportDataType} from '../models/export-models/export-data-type';
import {ConstraintService} from './constraint.service';
import {ResourceService} from './resource.service';
import {ExportJob} from '../models/export-models/export-job';
import {DataTableService} from './data-table.service';
import {saveAs} from 'file-saver';
import {MessageHelper} from '../utilities/message-helper';
import {ErrorHelper} from '../utilities/error-helper';
import {HttpErrorResponse} from '@angular/common/http';
import {AccessLevel} from './authentication/access-level';
import {AuthenticationService} from './authentication/authentication.service';
import {StudyService} from './study.service';
import {AsyncSubject} from 'rxjs';
import {AppConfig} from '../config/app.config';

@Injectable({
  providedIn: 'root',
})
export class ExportService {

  private _exportEnabled: AsyncSubject<boolean> = new AsyncSubject<boolean>();
  private _exportDataTypes: ExportDataType[] = [];
  private _exportJobs: ExportJob[] = [];
  private _exportJobName: string;
  private _isTransmartDateColumnsIncluded = false;
  private _isDataTypesUpdating = false;

  constructor(private appConfig: AppConfig,
              private constraintService: ConstraintService,
              private resourceService: ResourceService,
              private authService: AuthenticationService,
              private studyService: StudyService,
              private dataTableService: DataTableService) {
    this.authService.accessLevel.asObservable()
      .subscribe((level: AccessLevel) => {
        if (level === AccessLevel.Full) {
          this.exportEnabled.next(true);
          this.exportEnabled.complete();
        } else {
          this.studyService.existsPublicStudy
            .subscribe((existsPublicStudy) => {
              this.exportEnabled.next(existsPublicStudy);
              this.exportEnabled.complete();
            });
        }
      });

    /**
     * If the export-mode's name is 'transmart' and data-view is 'dataTable',
     *        is data table used for export job creation, which means
     *        updating data table first, then exprot data types, i.e.
     *        dataTableService.dataTableUpdated -> updateExportDataTypes()
     * Else, there is no need to wait for data table to complete,
     *        directly update export data types whenever the variables are updated, i.e.
     *        constraintService.variablesUpdated -> updateExportDataTypes()
     */
    if (this.isTransmartDataTable) {
      this.dataTableService.dataTableUpdated.asObservable()
        .subscribe(() => {
          this.updateExportDataTypes();
        });
    } else {
      this.constraintService.variablesUpdated.asObservable()
        .subscribe(() => {
          this.updateExportDataTypes();
        });
    }

  }

  private updateExportDataTypes() {
    // update the export info
    this.isDataTypesUpdating = true;
    this.resourceService.getExportDataTypes(this.constraintService.combination)
      .subscribe(dataTypes => {
          this.exportDataTypes = dataTypes;
          this.isDataTypesUpdating = false;
        },
        (err: HttpErrorResponse) => {
          ErrorHelper.handleError(err);
          this.exportDataTypes = [];
          this.isDataTypesUpdating = false;
        }
      );
  }

  /**
   * Create the export job when the user clicks the 'Export selected sets' button
   */
  public createExportJob(): Promise<any> {
    return new Promise((resolve, reject) => {
      let name = this.exportJobName.trim();

      if (this.validateExportJob(name)) {
        let summary = 'Running export job "' + name + '".';
        MessageHelper.alert('info', summary);
        this.resourceService.createExportJob(name)
          .subscribe(
            (newJob: ExportJob) => {
              summary = 'Export job "' + name + '" is created.';
              MessageHelper.alert('success', summary);
              this.exportJobName = '';
              this.runExportJob(newJob)
                .then(() => {
                  resolve(true);
                })
                .catch(err => {
                  reject(err)
                });
            },
            (err: HttpErrorResponse) => {
              ErrorHelper.handleError(err);
              reject(`Fail to create export job ${name}.`);
            }
          );
      } else {
        reject(`Invalid export job ${name}`);
      }
    });
  }

  /**
   * Run the just created export job
   * @param job
   */
  public runExportJob(job: ExportJob): Promise<any> {
    return new Promise((resolve, reject) => {
      this.resourceService.runExportJob(
        job,
        this.exportDataTypes,
        this.constraintService.combination,
        this.dataTableService.dataTable,
        this.isTransmartDateColumnsIncluded
      )
        .subscribe(
          returnedExportJob => {
            if (returnedExportJob) {
              this.updateExportJobs()
                .then(() => {
                  resolve(true);
                })
                .catch(err => {
                  reject(err);
                });
            } else {
              reject(`Fail to run export job ${job.name}, server returns undefined job.`);
            }
          },
          (err: HttpErrorResponse) => {
            ErrorHelper.handleError(err);
            reject(`Fail to run export job ${job.name}.`);
          }
        );
    });
  }

  /**
   * When an export job's status is 'completed', the user can click the Download button,
   * then the files of that job can be downloaded
   * @param job
   */
  downloadExportJob(job: ExportJob) {
    job.disabled = true;
    this.resourceService.downloadExportJob(job.id)
      .subscribe(
        (data) => {
          const blob = new Blob([data], {type: 'application/zip'});
          const filename = job.name + ' ' + job.time.toISOString();
          saveAs(blob, `${filename}.zip`, true);
        },
        (err: HttpErrorResponse) => {
          ErrorHelper.handleError(err);
        },
        () => {
          MessageHelper.alert('success', `Export ${job.name} download completed`);
          job.disabled = false;
        }
      );
  }

  cancelExportJob(job: ExportJob): Promise<any> {
    return new Promise((resolve, reject) => {
      job.disabled = true;
      this.resourceService.cancelExportJob(job.id)
        .subscribe(
          response => {
            this.updateExportJobs().then(() => {
              resolve(true);
            }).catch(err => {
              reject(err);
            })
          },
          (err: HttpErrorResponse) => {
            ErrorHelper.handleError(err);
            reject(err);
          }
        );
    });
  }

  archiveExportJob(job: ExportJob): Promise<any> {
    return new Promise((resolve, reject) => {
      job.disabled = true;
      this.resourceService.archiveExportJob(job.id)
        .subscribe(
          response => {
            this.updateExportJobs().then(() => {
              resolve(true);
            }).catch(err => {
              reject(err);
            })
          },
          (err: HttpErrorResponse) => {
            ErrorHelper.handleError(err);
            reject(err);
          }
        );
    });
  }

  public updateExportJobs(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.resourceService.getExportJobs()
        .subscribe(
          (jobs: ExportJob[]) => {
            jobs.forEach(job => {
              job.disabled = false
            });
            this.exportJobs = jobs;
            resolve(true);
          },
          (err: HttpErrorResponse) => {
            ErrorHelper.handleError(err);
            reject('Fail to update export jobs.');
          }
        );
    });
  }

  /**
   * Validate a new exportJob
   * @param {string} name
   * @returns {boolean}
   */
  public validateExportJob(name: string): boolean {
    let validName = name !== '';
    // 1. Validate if job name is specified
    if (!validName) {
      const summary = 'Please specify the job name.';
      MessageHelper.alert('warn', summary);
      return false;
    }
    // 2. Validate if job name is not duplicated
    for (let job of this.exportJobs) {
      if (job['jobName'] === name) {
        const summary = 'Duplicate job name, choose a new name.';
        MessageHelper.alert('warn', summary);
        return false;
      }
    }
    // 3. Validate if at least one data type is selected
    if (!this.exportDataTypes.some(ef => ef['checked'] === true)) {
      const summary = 'Please select at least one data type.';
      MessageHelper.alert('warn', summary);
      return false;
    }
    // 4. Validate if at least one file format is selected for checked data formats
    for (let dataFormat of this.exportDataTypes) {
      if (dataFormat['checked'] === true) {
        if (!dataFormat['fileFormats'].some(ff => ff['checked'] === true)) {
          const summary = 'Please select at least one file format for ' + dataFormat['name'] + ' data format.';
          MessageHelper.alert('warn', summary);
          return false;
        }
      }
    }
    // TODO: 5. Validate if at least one observation is included
    // let cohortService = this.injector.get(CohortService);
    // if (cohortService.counts_2.observationCount < 1) {
    //   const summary = 'No observation included to be exported.';
    //   MessageHelper.alert('warn', summary);
    //   return false;
    // }

    return true;
  }

  get isExternalExportAvailable(): boolean {
    return this.appConfig.getConfig('export-mode')['name'] !== 'transmart';
  }

  get isTransmartSurveyTable(): boolean {
    let exportMode = this.appConfig.getConfig('export-mode');
    return exportMode['name'] === 'transmart' && exportMode['data-view'] === 'surveyTable';
  }

  get isTransmartDataTable(): boolean {
    let exportMode = this.appConfig.getConfig('export-mode');
    return exportMode['name'] === 'transmart' && exportMode['data-view'] === 'dataTable';
  }

  get isTransmartDateColumnsIncluded(): boolean {
    return this._isTransmartDateColumnsIncluded;
  }

  set isTransmartDateColumnsIncluded(value: boolean) {
    this._isTransmartDateColumnsIncluded = value;
  }

  get exportDataTypes(): ExportDataType[] {
    return this._exportDataTypes;
  }

  set exportDataTypes(value: ExportDataType[]) {
    this._exportDataTypes = value;
  }

  get isDataTypesUpdating(): boolean {
    return this._isDataTypesUpdating;
  }

  set isDataTypesUpdating(value: boolean) {
    this._isDataTypesUpdating = value;
  }

  get exportJobs(): ExportJob[] {
    return this._exportJobs;
  }

  set exportJobs(value: ExportJob[]) {
    this._exportJobs = value;
  }

  get exportJobName(): string {
    return this._exportJobName;
  }

  set exportJobName(value: string) {
    this._exportJobName = value;
  }

  get isDataTableUpdating(): boolean {
    return this.dataTableService.isUpdating;
  }

  get exportEnabled(): AsyncSubject<boolean> {
    return this._exportEnabled;
  }

  set exportEnabled(value: AsyncSubject<boolean>) {
    this._exportEnabled = value;
  }
}
