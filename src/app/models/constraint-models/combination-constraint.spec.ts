import {CombinationConstraint} from './combination-constraint';
import {ConceptConstraint} from './concept-constraint';
import {Concept} from './concept';
import {PedigreeConstraint} from './pedigree-constraint';

describe('CombinationConstraint', () => {

  it('should find restrictions for the constraint dimension', () => {
    let combinationConstraint = new CombinationConstraint();

    let conceptConstraint1 = new ConceptConstraint();
    conceptConstraint1.concept = new Concept();
    let conceptConstraint2 = new ConceptConstraint();
    conceptConstraint2.concept = new Concept();
    conceptConstraint2.concept.subjectDimensions.push('patient');
    let conceptConstraint3 = new ConceptConstraint();
    conceptConstraint3.concept = new Concept();
    conceptConstraint3.concept.subjectDimensions.push('patient');
    conceptConstraint3.concept.subjectDimensions.push('Diagnosis ID');
    let conceptConstraint4 = new ConceptConstraint();
    conceptConstraint4.concept = new Concept();
    conceptConstraint4.concept.subjectDimensions.push('Biosource ID');
    let combinationConstraint2 = new CombinationConstraint();
    combinationConstraint2.addChild(conceptConstraint2);

    combinationConstraint.addChild(conceptConstraint1);
    expect(combinationConstraint.validDimensions).toEqual([]);

    combinationConstraint.addChild(conceptConstraint2);
    expect(combinationConstraint.validDimensions).toEqual(['patient']);

    combinationConstraint.addChild(conceptConstraint3);
    expect(combinationConstraint.validDimensions).toEqual(['patient']);

    combinationConstraint.children = [];
    combinationConstraint.addChild(conceptConstraint3);
    combinationConstraint.addChild(conceptConstraint4);
    expect(combinationConstraint.validDimensions).toEqual([]);

    combinationConstraint.children = [];
    combinationConstraint.addChild(combinationConstraint2);
    expect(combinationConstraint.validDimensions).toEqual([]);

    let pedigreeConstraint = new PedigreeConstraint('PAR');
    combinationConstraint.children = [];
    combinationConstraint.addChild(pedigreeConstraint);
    expect(combinationConstraint.validDimensions).toEqual(['patient']);
  });

});
