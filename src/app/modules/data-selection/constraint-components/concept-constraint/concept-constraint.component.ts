import {Component, OnInit, ViewChild, ElementRef} from '@angular/core';
import {ConstraintComponent} from "../constraint/constraint.component";
import {AutoComplete} from "primeng/components/autocomplete/autocomplete";
import {Concept} from "../../../shared/models/concept";
import {ConceptConstraint} from "../../../shared/models/constraints/concept-constraint";
import {ConceptOperatorState} from "./concept-operator-state";
import {ValueConstraint} from "../../../shared/models/constraints/value-constraint";
import {DateOperatorState} from "./date-operator-state";

@Component({
  selector: 'concept-constraint',
  templateUrl: './concept-constraint.component.html',
  styleUrls: ['./concept-constraint.component.css', '../constraint/constraint.component.css']
})
export class ConceptConstraintComponent extends ConstraintComponent implements OnInit {

  @ViewChild('autoComplete') autoComplete: AutoComplete;
  @ViewChild('categoricalAutoComplete') categoricalAutoComplete: AutoComplete;

  searchResults: Concept[];
  operatorState: ConceptOperatorState;
  isMinEqual: boolean;
  isMaxEqual: boolean;
  equalVal: number;
  minVal: number;
  maxVal: number;
  minLimit: number;
  maxLimit: number;

  selectedCategories: string[];
  suggestedCategories: string[];

  // date range
  private _applyDateConstraint: boolean = false;
  private _dateOperatorState: DateOperatorState = DateOperatorState.BETWEEN;
  DateOperatorState = DateOperatorState; // make enum visible in template
  static readonly dateOperatorSequence = {
    [DateOperatorState.BETWEEN]: DateOperatorState.AFTER,
    [DateOperatorState.AFTER]: DateOperatorState.BEFORE,
    [DateOperatorState.BEFORE]: DateOperatorState.NOT_BETWEEN,
    [DateOperatorState.NOT_BETWEEN]: DateOperatorState.BETWEEN
  };
  private _date1: Date;
  private _date2: Date;

  // trial visit
  private _applyTrialVisitConstraint: boolean = false;




  ngOnInit() {
    this.initializeAggregates();
  }

  initializeAggregates() {
    this.isMinEqual = true;
    this.isMaxEqual = true;
    this.operatorState = ConceptOperatorState.BETWEEN;

    this.selectedCategories = [];
    this.suggestedCategories = [];

    this._dateOperatorState = DateOperatorState.BETWEEN;

    let constraint:ConceptConstraint = <ConceptConstraint>this.constraint;
    if (constraint.concept) {

      // Construct a new constraint that only has the concept as sub constraint
      // (We don't want to apply value and date constraints when getting aggregates)
      let conceptOnlyConstraint:ConceptConstraint = new ConceptConstraint();
      conceptOnlyConstraint.concept = constraint.concept;

      this.resourceService.getConceptAggregate(conceptOnlyConstraint)
        .subscribe(
          aggregate => {
            constraint.concept.aggregate = aggregate;
            if (this.isNumeric()) {
              this.minLimit = aggregate.min;
              this.maxLimit = aggregate.max;
            }
            else if(this.isCategorical()) {
              this.selectedCategories = aggregate.values;
              this.suggestedCategories = aggregate.values;
            }
          },
          err => {
            console.error(err);
          }
        );
    }

    // Initialize the dates from the contraint's time constraint
    // Because the date picker represents the date/time in the local timezone,
    // we need to correct the date that is actually used in the constraint.
    let date1 = constraint.timeConstraint.date1;
    this._date1 = new Date(date1.getTime() + 60000 * date1.getTimezoneOffset());
    let date2 = constraint.timeConstraint.date2;
    this._date2 = new Date(date2.getTime() + 60000 * date2.getTimezoneOffset());
  }

  get selectedConcept():Concept {
    return (<ConceptConstraint>this.constraint).concept;
  }

  set selectedConcept(value:Concept) {
    if (value instanceof Concept) {
      (<ConceptConstraint>this.constraint).concept = value;
      this.initializeAggregates();
      this.constraintService.update();
    }

  }

  onSearch(event) {
    let query = event.query.toLowerCase();
    let concepts = this.dimensionRegistry.getConcepts();
    if (query) {
      this.searchResults = concepts.filter((concept: Concept) => concept.path.toLowerCase().includes(query));
    }
    else {
      this.searchResults = concepts;
    }
  }

  onDropdown(event) {
    let concepts = this.dimensionRegistry.getConcepts();

    // Workaround for dropdown not showing properly, as described in
    // https://github.com/primefaces/primeng/issues/745
    this.searchResults = [];
    this.searchResults = concepts;
    event.originalEvent.preventDefault();
    event.originalEvent.stopPropagation();
    if (this.autoComplete.panelVisible) {
      this.autoComplete.hide();
    } else {
      this.autoComplete.show();
    }
  }

  onCategorySearch(event) {
    let query = event.query.toLowerCase().trim();

    let categories = (<ConceptConstraint>this.constraint).concept.aggregate.values;
    if (query) {
      this.suggestedCategories =
        categories.filter((category: string) => category.toLowerCase().includes(query));
    }
    else {
      this.suggestedCategories = categories;
    }
  }

  isNumeric() {
    let concept:Concept = (<ConceptConstraint>this.constraint).concept;
    if (!concept) {
      return false;
    }
    return concept.type === 'NUMERIC';
  }

  isCategorical() {
    let concept:Concept = (<ConceptConstraint>this.constraint).concept;
    if (!concept) {
      return false;
    }
    return concept.type === 'CATEGORICAL_OPTION';
  }

  isBetween() {
    return this.operatorState === ConceptOperatorState.BETWEEN;
  }

  switchOperatorState() {
    if(this.isNumeric()) {
      this.operatorState =
        (this.operatorState === ConceptOperatorState.EQUAL) ?
          (this.operatorState = ConceptOperatorState.BETWEEN) :
          (this.operatorState = ConceptOperatorState.EQUAL);
    }
    this.updateConceptValues();
  }

  selectAll() {
    this.selectedCategories = (<ConceptConstraint>this.constraint).concept.aggregate.values;
    this.updateConceptValues();
  }
  selectNone() {
    this.selectedCategories = [];
  }

  getOperatorButtonName() {
    let name = '';
    if(this.isNumeric()) {
      name = (this.operatorState === ConceptOperatorState.BETWEEN) ? 'between' : 'equal to';
    }
    return name;
  }

  updateConceptValues() {
    let conceptConstraint:ConceptConstraint = <ConceptConstraint>this.constraint;

    //if the concept is numeric
    if(this.isNumeric()) {
      //if to define a single value
      if(this.operatorState === ConceptOperatorState.EQUAL) {
        if(typeof this.equalVal === 'number') {
          let newVal: ValueConstraint = new ValueConstraint();
          newVal.valueType = this.selectedConcept.type;
          newVal.operator = '=';
          newVal.value = this.equalVal;
          conceptConstraint.values = [];
          conceptConstraint.values.push(newVal);
        }
      }

      //else if to define a value range
      else if(this.operatorState === ConceptOperatorState.BETWEEN) {
        conceptConstraint.values = [];
        if(typeof this.minVal === 'number') {
          let newMinVal: ValueConstraint = new ValueConstraint();
          newMinVal.valueType = this.selectedConcept.type;
          newMinVal.operator = '>';
          if(this.isMinEqual) newMinVal.operator = '>=';
          newMinVal.value = this.minVal;
          conceptConstraint.values.push(newMinVal);
        }

        if(typeof this.maxVal === 'number') {
          let newMaxVal: ValueConstraint = new ValueConstraint();
          newMaxVal.valueType = this.selectedConcept.type;
          newMaxVal.operator = '<';
          if(this.isMaxEqual) newMaxVal.operator = '<=';
          newMaxVal.value = this.maxVal;
          conceptConstraint.values.push(newMaxVal);
        }
      }
    }
    //else if the concept is categorical
    else if(this.isCategorical()){
      conceptConstraint.values = [];
      for(let category of this.selectedCategories) {
        let newVal: ValueConstraint = new ValueConstraint();
        newVal.valueType = 'STRING';
        newVal.operator = '=';
        newVal.value = category;
        conceptConstraint.values.push(newVal);
      }
    }

    this.constraintService.update();

  }

  get applyDateConstraint():boolean {
    return this._applyDateConstraint;
  }

  set applyDateConstraint(value:boolean) {
    this._applyDateConstraint = value;
    let conceptConstraint:ConceptConstraint = <ConceptConstraint>this.constraint;
    conceptConstraint.applyDateConstraint = this._applyDateConstraint;
    this.constraintService.update();
  }

  get date1():Date {
    return this._date1;
  }

  set date1(value:Date) {
    // Ignore invalid values
    if (!value) {
      return;
    }

    this._date1 = value;

    // Because the date picker represents the date/time in the local timezone,
    // we need to correct the date that is actually used in the constraint.
    let correctedDate = new Date(value.getTime() - 60000 * value.getTimezoneOffset());
    let conceptConstraint:ConceptConstraint = <ConceptConstraint>this.constraint;
    conceptConstraint.timeConstraint.date1 = correctedDate;
    this.constraintService.update();
  }

  get date2():Date {
    return this._date2;
  }

  set date2(value:Date) {
    // Ignore invalid values
    if (!value) {
      return;
    }

    this._date2 = value;

    // Because the date picker represents the date/time in the local timezone,
    // we need to correct the date that is actually used in the constraint.
    let correctedDate = new Date(value.getTime() - 60000 * value.getTimezoneOffset());
    let conceptConstraint:ConceptConstraint = <ConceptConstraint>this.constraint;
    conceptConstraint.timeConstraint.date2 = correctedDate;
    this.constraintService.update();
  }

  get dateOperatorState():DateOperatorState {
    return this._dateOperatorState;
  }

  get applyTrialVisitConstraint(): boolean {
    return this._applyTrialVisitConstraint;
  }

  set applyTrialVisitConstraint(value: boolean) {
    this._applyTrialVisitConstraint = value;
  }

  switchDateOperatorState() {
    // Select the next state in the operator sequence
    this._dateOperatorState = ConceptConstraintComponent.dateOperatorSequence[this._dateOperatorState];

    // Update the constraint
    let conceptConstraint:ConceptConstraint = <ConceptConstraint>this.constraint;
    conceptConstraint.timeConstraint.dateOperator = this._dateOperatorState;

    // Notify constraint service
    this.constraintService.update();
  }

}
