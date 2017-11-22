"Name", "Rasse", "Status", "Kurzbeschreibung", "Finanzen", "Heimat", "EPtotal", "EPspent"

Eigenheiten

Vorteile

# FilterViews

A FilterView consists of:
  * a mandatory sub-object of the Ilaris object, describing the parts of a character that should be displayed,
  * optional FilterConstraints on its elements

## FilterConstraints

### FilterConstraints for values
A FilterConstraint for values can be applied to a single value, evaluating to either True or False.
An atomic FilterConstraint for values consists of:
  * an assumed data type (string or int)
  * a condition to be checked
    * for strings:
      * a pattern and a set of flags to create a RegExp
    * for ints:
      * a formula in either conjunctive or disjunctive normal form without negation, where the literals in the inner clauses consist of:
        * one of the comparison operators "=", "<" and ">"
        * a value to compare with

### FilterConstraints for lists
A FilterConstraint for lists can be applied to a list, returning a sublist.
An atomic FilterConstraint for lists consists of:
  * a single data type which is assumed for all elements of the list (string, int, list or object)
  * a criterion from the following list:
    * matching -- only matching list elements will be returned
    * all -- all list elements will be returned if at least one list element matches
  * a FilterConstraint for the assumed data type of the list

### FilterConstraints for objects
A FilterConstraint for objects can be applied to a JSON object, evaluating to either True or False.
An atomic FilterConstraint for objects resembles an object but all leaves are FilterConstraints.
It has an additional Policy, which is either skip or cancel.
If an object is compared against the FilterConstraint, the object is recursively inspected.
Whenever a leaf is encountered in the FilterConstraint, it is applied to the corresponding value in the input object.
Should the input object not have the required property, either False is returned (in case of Policy "cancel"), or it is skipped (in case of Policy "skip").

### Boolean combinations
FilterConstraints of the same type can be connected by boolean connectors (conjunction and disjunction) and negation (only for object and value). In case of FilterConstraints for lists, conjunction acts as intersection. Note that negation only makes sense considering a complement, and is thus not considered.
