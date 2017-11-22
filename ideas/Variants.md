# Variations and Variants

A /variation/ modifies some property of a character. In its simplest form, it is a flat modifier to the property's value. A variation is either an /inner variation/ or an /outer variation/. An inner variation is to be applied /before/ any further calculations are done with the modified property. An outer variation is to be applied /after/ any further calculations. For example, a spell could give a flat bonus +4 to the PW of an Attribut and also a bonus +2 to the PW of each Fertigkeit that involves this Attribut. In this case, both variations are outer variations. A flat bonus to an Attribut (and not the PW) is an example for an inner variation, as this may also change other values like WS.

As a result, inner variations trigger set-listeners, while outer variations do not.

A /variant/ is a list of variations, to be applied from left to right. Any two variants can be composed by concatenation.

Hence, the order of application of a variant V of length n is as follows:

for (i = 0; i < n; ++i) {
  if V[i] is an inner variation {
    apply V[i]
  }
}

<Make general calculations here>

for (i = 0; i < n; ++i) {
  if V[i] is an outer variation {
    apply V[i]
  }
}
