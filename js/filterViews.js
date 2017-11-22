var FVdataTypes = Object.freeze({STRING: "String", INT: "Int", OBJECT: "Object", LIST: "List"});
var FVatomicConstraintTypes = Object.freeze({VALUE: "AtomicValue", LIST: "AtomicSet", OBJECT: "AtomicObject"});
var FVlogicalConnectives = Object.freeze({DISJUNCTION: "||", CONJUNCTION: "&&"});
var FVintFormulaType = Object.freeze({CLAUSE: "Clause", LITERAL: "Literal"});
var FVlistCriteria = Object.freeze({MATCHING: "Matching elements only", ALL: "All elements if at least one matches"});
var FVpolicies = Object.freeze({SKIP: "Skip non-existent keys", CANCEL: "Cancel on non-existent key"});

function FVcreateValueFilterConstraint (dataType, condition) {

  if (dataType === FVdataTypes.String) {
    return { constraintType: FVatomicConstraintTypes.VALUE, dataType: FVdataTypes.INT, pattern: condition.pattern, flags: condition.flags };
  }
  if (dataType === FVdataTypes.Int) {
    return { constraintType: FVatomicConstraintTypes.VALUE, dataType: FVdataTypes.INT, formula: condition };
  }

  return null;

}

function FVevalListFilterConstraint(constraint, list) {

  if (constraint.constraintType === FVatomicConstraintTypes.LIST) {

    var matches = list.reduce(function(acc, next) {
      if ((constraint.dataType === FVdataTypes.STRING) || (constraint.dataType === FVdataTypes.INT)) {
        if (FVevalValueFilterConstraint(constraint.constraint,next)) {
          return acc.concat([next]);
        } else {
          return acc;
        }
      }
      if ((constraint.dataType === FVdataTypes.OBJECT)) {
        if (FVevalObjectFilterConstraint(constraint.constraint,next)) {
          return acc.concat([next]);
        } else {
          return acc;
        }
      }

      if ((constraint.dataType === FVdataTypes.LIST)) {
        var localMatches = FVevalListFilterConstraint(constraint.constraint,next);
        return acc.concat([localMatches]);
      }

      return acc;

    }, []);

    if ((constraint.dataType === FVdataTypes.STRING) || (constraint.dataType === FVdataTypes.INT) || (constraint.dataType === FVdataTypes.OBJECT)) {
      if (constraint.criterion === FVlistCriteria.MATCHING) return matches;
      if (constraint.criterion === FVlistCriteria.ALL) {if (matches.length > 0) { return list; } else {return []}}
    }
    if ((constraint.dataType === FVdataTypes.LIST)) {
      if (constraint.criterion === FVlistCriteria.MATCHING) {
        // Return non-empty local match sets
        return matches.reduce(function(acc,next) {
          if (next.length > 0) {
            return acc.concat([next]);
          }
          return acc;
        },[])
      }
      if (constraint.criterion === FVlistCriteria.ALL) {
        if (matches.reduce(function(acc,next) {
          return acc || (next.length > 0);
        }, false)) {
          return list;
        } else {
          return [];
        }
      }
    }

  }
  return null;
}


function FVevalValueFilterConstraint(constraint, value) {

  if (constraint.constraintType === FVatomicConstraintTypes.VALUE) {
    if (constraint.dataType === FVdataTypes.STRING) {
      return new RegExp(constraint.pattern, constraint.flags).test(value);
    }
    if (constraint.dataType === FVdataTypes.INT) {
      return FVevalIntFormula(constraint.formula, value);
    }
  }


  return null;
}

function FVevalObjectFilterConstraint(constraint, x) {

  // If the type is either LIST or VALUE, x should be a LIST or VALUE
  if (constraint.constraintType === FVatomicConstraintTypes.LIST) {
    return FVevalListFilterConstraint(constraint, x).length > 0;
  }
  if (constraint.constraintType === FVatomicConstraintTypes.VALUE) {
    return FVevalValueFilterConstraint(constraint, x);
  }

  // If the type is neither LIST nor VALUE, x should be an OBJECT
  if (constraint.constraintType === FVatomicConstraintTypes.OBJECT) {
    return Object.keys(constraint.obj).reduce(function(acc, next) {

      if (!(next in x)) {
        if (constraint.policy === FVpolicies.SKIP) {
          return acc;
        }
        if (constraint.policy === FVpolicies.CANCEL) {
          return false;
        }
        return null;
      }

      // x.next is defined:

      return acc = acc && FVevalObjectFilterConstraint(FVstripObjectConstraint(constraint,next),x[next]);

    }, true);

  }


  return null;
}

function FVstripObjectConstraint(constraint,next) {

  if ("constraintType" in constraint.obj[next]) {
    // we have found a leaf
    return constraint.obj[next];
  }
  // We are not at a leaf yet
  return {
    constraintType: FVatomicConstraintTypes.OBJECT,
    policy: constraint.policy,
    obj: constraint.obj[next]
  }
}


function FVevalIntFormulaLiteral(literal, value) {


  if (literal.op === "<") return value < literal.to;
  if (literal.op === ">") return value > literal.to;
  if (literal.op === "=") return value == literal.to;
  return null;
}

function FVevalIntFormula(formula, value) {

  if (formula.formulaType === FVintFormulaType.LITERAL) {
    return FVevalIntFormulaLiteral(formula.literal, value);
  }

  if (formula.formulaType === FVintFormulaType.CLAUSE) {

    result = null;
    if (formula.connective === FVlogicalConnectives.DISJUNCTION) result = false;
    if (formula.connective === FVlogicalConnectives.CONJUNCTION) result = true;

    return formula.clause.reduce(function(acc, next) {
      if (formula.connective === FVlogicalConnectives.DISJUNCTION) return acc || FVevalIntFormula(next, value);
      if (formula.connective === FVlogicalConnectives.CONJUNCTION) return acc && FVevalIntFormula(next, value);
      return acc;
    }, result);
  }

  return null;

}

/* EXAMPLES */


eleven = {
  formulaType: FVintFormulaType.LITERAL,
  literal: {
    op: "=",
    to: 11
  }
}

positive = {
  formulaType: FVintFormulaType.LITERAL,
  literal: {
    op: ">",
    to: 0
  }
}

belowTen = {
  formulaType: FVintFormulaType.LITERAL,
  literal: {
    op: "<",
    to: 10
  }
}



zero = {
  formulaType: FVintFormulaType.LITERAL,
  literal: {
    op: "=",
    to: 0
  }
}


semiPositive = {
  formulaType: FVintFormulaType.CLAUSE,
  connective: FVlogicalConnectives.DISJUNCTION,
  clause: [positive, zero]
}

semiPositiveBelowTen = {
  formulaType: FVintFormulaType.CLAUSE,
  connective: FVlogicalConnectives.CONJUNCTION,
  clause: [belowTen,semiPositive]
}

semiPositiveBelowTenOrEleven = {
  formulaType: FVintFormulaType.CLAUSE,
  connective: FVlogicalConnectives.DISJUNCTION,
  clause: [semiPositiveBelowTen,eleven]
}

constraintSemiPositiveBelowTenOrEleven = {
  constraintType: FVatomicConstraintTypes.VALUE,
  dataType: FVdataTypes.INT,
  formula: semiPositiveBelowTenOrEleven
}

containsHello = {
  constraintType: FVatomicConstraintTypes.VALUE,
  dataType: FVdataTypes.STRING,
  pattern: ".*Hello.*",
  flags: []
}

matchCarl = {
  constraintType: FVatomicConstraintTypes.VALUE,
  dataType: FVdataTypes.STRING,
  pattern: ".*Carl.*",
  flags: []
}

listContainsCarl = {
  constraintType: FVatomicConstraintTypes.LIST,
  dataType: FVdataTypes.STRING,
  constraint: matchCarl,
  criterion: FVlistCriteria.ALL
}



listContainsHello = {
  constraintType: FVatomicConstraintTypes.LIST,
  dataType: FVdataTypes.STRING,
  constraint: containsHello,
  criterion: FVlistCriteria.ALL
}

sublistContainsHello = {
  constraintType: FVatomicConstraintTypes.LIST,
  dataType: FVdataTypes.STRING,
  constraint: containsHello,
  criterion: FVlistCriteria.MATCHING
}

constraintPositive = {
  constraintType: FVatomicConstraintTypes.VALUE,
  dataType: FVdataTypes.INT,
  formula: positive
}

sublistPositive = {
  constraintType: FVatomicConstraintTypes.LIST,
  dataType: FVdataTypes.INT,
  constraint: constraintPositive,
  criterion: FVlistCriteria.MATCHING
}

containsPositive = {
  constraintType: FVatomicConstraintTypes.LIST,
  dataType: FVdataTypes.INT,
  constraint: constraintPositive,
  criterion: FVlistCriteria.ALL
}


sublistOfsublistPositive = {
  constraintType: FVatomicConstraintTypes.LIST,
  dataType: FVdataTypes.LIST,
  constraint: sublistPositive,
  criterion: FVlistCriteria.MATCHING
}

containsOfsublistPositive = {
  constraintType: FVatomicConstraintTypes.LIST,
  dataType: FVdataTypes.LIST,
  constraint: sublistPositive,
  criterion: FVlistCriteria.ALL
}

sublistOfcontainsPositive = {
  constraintType: FVatomicConstraintTypes.LIST,
  dataType: FVdataTypes.LIST,
  constraint: containsPositive,
  criterion: FVlistCriteria.MATCHING
}

containsOfcontainsPositive = {
  constraintType: FVatomicConstraintTypes.LIST,
  dataType: FVdataTypes.LIST,
  constraint: containsPositive,
  criterion: FVlistCriteria.ALL
}

notNewbornButFunnySized = {
  constraintType: FVatomicConstraintTypes.OBJECT,
  policy: FVpolicies.CANCEL,
  obj:  {
    info: {
      age: constraintPositive,
      height: constraintSemiPositiveBelowTenOrEleven
    },
    friends: listContainsCarl
  }
}

newborn = {
  info: {
    age: 0,
    name: "Carl"
  },
  friends: []
}

infant = {
  info: {
    age: 10,
    name: "Peter",
    height: 11
  },
  friends: ["Rita", "Carl"]
}

lonelyInfant = {
  info: {
    age: 2,
    name: "Sartre the sad",
    height: 7
  },
  friends: []
}

containsMatchingInfant = {
  constraintType: FVatomicConstraintTypes.LIST,
  dataType: FVdataTypes.OBJECT,
  constraint: notNewbornButFunnySized,
  criterion: FVlistCriteria.ALL
}
sublistMatchingInfant = {
  constraintType: FVatomicConstraintTypes.LIST,
  dataType: FVdataTypes.OBJECT,
  constraint: notNewbornButFunnySized,
  criterion: FVlistCriteria.MATCHING
}


//console.log(FVevalValueFilterConstraint(constraintSemiPositiveBelowTenOrEleven,11));
//console.log(FVevalListFilterConstraint(listContainsHello, ["Aha! Hello World Gell", "Hello Mister", "Hallo meine Dame", "Heller! Silber! Hellooooo"]));
/*console.log(FVevalListFilterConstraint(containsPositive,[2,4,6]));
console.log(FVevalListFilterConstraint(containsPositive,[-1,2]));
console.log(FVevalListFilterConstraint(containsPositive,[-1,-3]));
console.log(FVevalListFilterConstraint(containsPositive,[]));
console.log(FVevalListFilterConstraint(sublistPositive,[2,4,6]));
console.log(FVevalListFilterConstraint(sublistPositive,[-1,2]));
console.log(FVevalListFilterConstraint(sublistPositive,[-1,-3]));
console.log(FVevalListFilterConstraint(sublistPositive,[]));
console.log(FVevalListFilterConstraint(containsOfsublistPositive,[[-9],[-1],[-1,-3], []]));
console.log(FVevalListFilterConstraint(sublistMatchingInfant, [infant, lonelyInfant, newborn]));
*/

/* ILARIS EXAMPLES */

function getFWSelector(operator, value) {
  return {
    constraintType: FVatomicConstraintTypes.VALUE,
    dataType: FVdataTypes.INT,
    formula: {
      formulaType: FVintFormulaType.LITERAL,
      literal: {
        op: operator,
        to: value
      }
    }
  }
}

function getFWListSelector(operator, value, matchingCriterion) {
  return {
    constraintType: FVatomicConstraintTypes.LIST,
    criterion: matchingCriterion,
    constraint: getFWSelector(operator, value),
    dataType: FVdataTypes.INT
  }
}
alleAusKategorieWennEinsGewaehlt = getFWListSelector(">",0, FVlistCriteria.ALL);
alleGewaehltenAusKategorie = getFWListSelector(">",0, FVlistCriteria.MATCHING);
