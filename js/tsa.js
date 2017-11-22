TSArules = {
  "pw": {
    "arity": 1,
    "calc": {
      "op": "add",
      "args": [
        {
          "op": "get",
          "args": ["fw", "$1"]

        },
        {
          "op": "divide",
          "args": [
            {
              "op": "get",
              "args" : ["bw", "$1"]
            },
            2
          ]
        }
      ]
    }
  },
  "fw" : {
    "arity": 1,
    "calc": {
      "op" : "load",
      "args": ["$0.fw"]
    }
  },
  "bw" : {
    "arity": 3,
    "calc": {
      "op" : "divide",
      "args" : [
        {
          "op": "sum",
          "args" : [
            { 
              "op" : "get",
              "args": ["Attribut","$0"]
            },
            {
              "op" : "get",
              "args": ["Attribut","$1"]
            },
            {
              "op" : "get",
              "args": ["Attribut","$2"]
            }
            ]
        }
        ,
        3
      ]
    }
  },
  "Attribut" : {
    "arity": "1",
    "calc" : {
      "op" : "load",
      "args" : ["Attribut.$0"]
    }
  }

};


TSA = {};

function TSAinitialize() {

$.each(Object.keys(TsaRules), function(x, key) {
  if (!TsaRules.hasOwnProperty(key)) return;
  TSAaddRule(key);
});

}

function TSAaddRule(key) {
  TSA[key] = TSAaddRuleR(TSArules[key]);

}

function TSAaddRuleR(rule) {
  console.log("R");
  console.log(rule);

  if (!rule.hasOwnProperty("calc")) {
    console.log("simple: ");
    console.log(rule);
    return function() {
      return rule;
    };
  }

  if (rule.calc.op === "load") {
    console.log("load.");

    return function(character) {
      var path = rule.calc.args[0].split("$0").join(arguments[1]);
      return TSAgoto(character, path);
    };

  }

  var functions = [];
    for (var i = 0; i < rule.arity; ++i) {
    functions.push(TSAaddRuleR(rule.calc.args[i]));
  }
  console.log("complex:");
  console.log(functions);

  if (rule.calc.op === "sum") {
    return function(character) {
      var r = 0;
      for (var i = 0; i < rule.arity; ++i) {
        r = r + functions[i](arguments[i+1]);
      }
      return r;
    }
  }

  if (rule.calc.op === "divide") {
    return function(character) {
      var r = functions[i](character, arguments[1]);
      for (var i = 1; i < rule.arity; ++i) {
        r = r / functions[i](character, arguments[i+1]);
      }
      return r;
    }
  }

}

function TSAgoto(obj, path) {

  var split = path.split(".");
  if (split.length == 1) {
    return obj[path];
  }
  nObj = obj[split[0]];

  split.splice(0,1);
  return TSAgoto(nObj, split.join("."));
}

f = TSAaddRuleR(TSArules["bw"]);
console.log(f(
  {
    "Attribut": {"KK": 17, "MU": 2}
  }
, "MU", "KK", "KK"));
