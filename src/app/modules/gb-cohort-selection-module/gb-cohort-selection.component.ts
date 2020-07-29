/**
 * Copyright 2017 - 2018  The Hyve B.V.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {Component, OnInit, ViewChild} from '@angular/core';
import {FormatHelper} from '../../utilities/format-helper';
import {CohortService} from '../../services/cohort.service';
import {MessageHelper} from '../../utilities/message-helper';
import {GbConstraintComponent} from './constraint-components/gb-constraint/gb-constraint.component';
import {CombinationConstraint} from '../../models/constraint-models/combination-constraint';
import {ConstraintService} from '../../services/constraint.service';
import {CountService} from '../../services/count.service';

@Component({
  selector: 'gb-cohort-selection',
  templateUrl: './gb-cohort-selection.component.html',
  styleUrls: ['./gb-cohort-selection.component.css']
})
export class GbCohortSelectionComponent implements OnInit {

  @ViewChild('rootConstraintComponent') rootConstraintComponent: GbConstraintComponent;

  public cohortName: string;

  constructor(private cohortService: CohortService,
              private constraintService: ConstraintService,
              private countService: CountService) {
    this.cohortName = '';
  }

  ngOnInit() {
  }

  /**
   * The event handler for the accordion tab open event,
   * to access the accordion, use event.index
   * @param event
   */
  openAccordion(event) {
  }

  /**
   * The event handler for the accordion tab close event,
   * to access the accordion, use event.index
   * @param event
   */
  closeAccordion(event) {
  }

  get subjectCount(): string {
    return FormatHelper.formatCountNumber(this.countService.currentSelectionCount.subjectCount);
  }

  get rootConstraint(): CombinationConstraint {
    return this.constraintService.rootConstraint;
  }

  get observationCount(): string {
    return FormatHelper.formatCountNumber(this.countService.currentSelectionCount.observationCount);
  }

  get isSavingCohortCompleted(): boolean {
    return this.cohortService.isSavingCohortCompleted;
  }

  get isUpdating(): boolean {
    return this.cohortService.isUpdatingCurrent;
  }

  get isDirty(): boolean {
    return this.cohortService.isDirty;
  }

  get isContacting(): boolean {
    return this.cohortService.isContacting;
  }

  set isContacting(val: boolean) {
    this.cohortService.isContacting = false;
  }

  get contactSynopsis(): string {
    return this.cohortService.contactSynopsis;
  }

  set contactSynopsis(value: string) {
    this.cohortService.contactSynopsis = value;
  }

  /**
   * Prevent the default behavior of node drop
   * @param event
   */
  preventNodeDrop(event) {
    event.stopPropagation();
    event.preventDefault();
  }

  saveCohort() {
    let name = this.cohortName ? this.cohortName.trim() : '';
    const isNameValid = name !== '';
    if (isNameValid) {
      this.cohortService.saveCohortByName(name);
      this.cohortName = '';
    } else {
      MessageHelper.alert('error', 'Please specify the cohort name.', '');
    }
  }

  update(event) {
    event.stopPropagation();
    this.cohortService.updateCountsWithCurrentCohort();
  }

  async contact(event) {
    // TODO: fetch the synopsis
    const result = await this.cohortService.contactCohort();
    if (result.previouslyContacted && result.contactCount === result.previousContactCount) {
      MessageHelper.alert(
        'error',
        'You\'ve contacted all members of this cohort previously.',
        '',
        );
      this.isContacting = false;
      return;
    }
    MessageHelper.alert(
      'info',
      `Contacted ${result.contactCount - result.previousContactCount} new patients`,
      '',
    );
    this.isContacting = false;
  }

  showContactModal(event) {
    this.cohortService.isContacting = true;
  }
}
