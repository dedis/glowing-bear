/**
 * Copyright 2017 - 2018  The Hyve B.V.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {TransmartPackerJob} from '../../models/transmart-packer-models/transmart-packer-job';
import {TransmartExportJob} from '../../models/transmart-models/transmart-export-job';

const statusDictionary: { [status: string]: string | undefined } = {
  REGISTERED: 'Created',
  CANCELLED: 'Cancelled',
  FETCHING: 'Fetching',
  RUNNING: 'Running',
  SUCCESS: 'Completed',
  FAILED: 'Error. Contact administrator.'
};

export class TransmartPackerMapper {

  static mapCustomExportJob(job: TransmartPackerJob): TransmartExportJob {
    let ej = new TransmartExportJob();
    if (job) {
      ej.id = job.task_id;
      ej.jobName = job.job_parameters['custom_name'] ? job.job_parameters['custom_name'] : job.task_id;
      ej.jobStatus = statusDictionary[job.status];
      ej.jobStatusTime = job.created_at;
      ej.userId = job.user;
    }
    return ej;
  }

  static mapCustomExportJobs(exJobs: TransmartPackerJob[]): TransmartExportJob[] {
    let jobs: TransmartExportJob[] = [];
    exJobs.forEach(exJob => {
      try {
        let job = this.mapCustomExportJob(exJob);
        jobs.push(job);
      } catch (err) {
        console.error(`Error while mapping external job: ${exJob.task_id}`, exJob);
      }
    });
    return jobs;
  }

}
