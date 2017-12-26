TSArecipes = {
  Attribut : {
    ingredients : {
        loads : [
          {key: "a", path: "Attribute.$0"}
        ],
    },
    steps: [
      {return: "_a_"}
    ]
  },
  bw: {
    ingredients: {
      loads: [
        {key: "a", path: "Fertigkeiten.$0.Attribute"}
      ],
      uses : [
        {key: "a1", recipe: "Attribut", args: ["_a[0]_"]},
        {key: "a2", recipe: "Attribut", args: ["_a[1]_"]},
        {key: "a3", recipe: "Attribut", args: ["_a[2]_"]}
      ]
    },
    steps: [
      {sum: ["_a1_", "_a2_", "_a3_"], key: "r"},
      {div: ["_r_", 3], key: "r"},
      {return: "_r_"}
    ]
  },
  fw: {
    ingredients: {
      loads: [
        {key: "fw", path: "Fertigkeiten.$0.fw"}
      ],
      uses: [

      ]
    },
    steps: [
      {return: "_fw_"}
    ]
  },
  pwt: {
    ingredients: {
      loads: [
      ],
      uses: [
        {key: "bw", recipe: "bw", args: ["$0"]},
        {key: "fw", recipe: "fw", args: ["$0"]}      ]
    },
    steps: [
      {sum: ["_bw_", "_fw_"], key: "r"},
      {return: "_r_"}
    ]
  }

};

_interpreted = new Map();
_loaded = new Map();
_cooked = new Map();
_usedBy = new Map(); // character -> (recipeKey -> argstring) -> (recipeKey -> argstring)

function _update(character, usedRecipe, usedArgs) {
  if (!_usedBy.has(character)) {
    return;
  }
  var forC = _usedBy.get(character);
  if (!forC.has(usedRecipe)) {
    return;
  }
  var forUsedR = forC.get(usedRecipe);
  if (!forUsedR.has(usedArgs)) {
    return;
  }
  var forUsedA = forUsedR.get(usedArgs);

  for (var forUserR of forUsedA.keys()) {
    for (var forUserA of forUsedA.get(forUserR).keys()) {
      console.log(forUserR + " : " + forUserA);
    }
  }


}

function _addUser(character, usedRecipe, usedArgs, userRecipe, userArgs) {
  if (!_usedBy.has(character)) {
    _usedBy.set(character, new Map());
  }
  var forC = _usedBy.get(character);
  if (!forC.has(usedRecipe)) {
    forC.set(usedRecipe, new Map());
  }
  var forUsedR = forC.get(usedRecipe);
  if (!forUsedR.has(usedArgs)) {
    forUsedR.set(usedArgs, new Map());
  }
  var forUsedA = forUsedR.get(usedArgs);
  if (!forUsedA.has(userRecipe)) {
    forUsedA.set(userRecipe, new Set());
  }
  var forUserR = forUsedA.get(userRecipe);
  forUserR.add(userArgs);
}


function TSAload(path, args) {
  for (var i = 1; i < args.length; ++i) {
    path = (path + "").split("$" + (i-1)).join(args[i]);
  }
  var character = args[0];
  if (!_loaded.has(character)) {
    _loaded.set(character, new Map());
  }
  var forC = _loaded.get(character);
  if (forC.has(path)) {
    return forC.get(path);
  }
  var obj = character;
  $.each((path + "").split("."), function(s, step) {
    obj = obj[step];
  });
  forC.set(path, obj);
  return obj;
}


function TSAreplace(s, ingredients) {

    var result = s;

    $.each(ingredients, function(i, ii) {
      if (Array.isArray(ii)) {
        for (var j = 0; j < ii.length; ++j) {
          result = (result + "").split("_" + i + "[" + j + "]_").join(ii[j]);
        }
      } else {
        result = (result + "").split("_" + i + "_").join(ii);
      }
    });

    return result;
}

function TSAinterprete(recipeKey) {

  if (_interpreted.has(recipeKey)) return _interpreted.get(recipeKey);

  console.log("Interpreting " + recipeKey);

  var recipe = TSArecipes[recipeKey];

  var ingredients = new Object(null);
  var loaded = [];
  var used = [];

  $.each(
    recipe.ingredients.loads, function(l, load) {
      ingredients[load.key] = function(_ingredients, _args) {return TSAload(TSAreplace(load.path, _ingredients), _args)};
      loaded.push(load.key);
    }
  );

  $.each(
    recipe.ingredients.uses, function(u, use) {
      var f = TSAinterprete(use.recipe);
      ingredients[use.key] = function(_args) {return f.apply(null,_args)};
      used.push({key: use.key, args: use.args, recipe: use.recipe});
    }
  );

  var steps = [];

  $.each(
    recipe.steps, function(s, step) {
      if ("return" in step) {
        steps[s] = function(_ingredients, _args) {
          return TSAreplace(step.return, _ingredients);
        }
      }
      if ("sum" in step) {
        steps[s] = function(_ingredients, _args) {
          var result = 0;
          for (var i = 0; i < step.sum.length; ++i) {
            result = result + parseInt(TSAreplace(step.sum[i], _ingredients));
          }
          _ingredients[step.key] = result;
          return result;
        }
      }
      if ("div" in step) {
        steps[s] = function(_ingredients, _args) {
          var result = parseInt(TSAreplace(step.div[0], _ingredients));
          for (var i = 1; i < step.div.length; ++i) {
            result = result / parseInt(TSAreplace(step.div[i], _ingredients));
          }
          result = Math.round(result);
          _ingredients[step.key] = result;
          return result;
        }
      }

    }
  );




  var f = function() {


      var args = arguments;
      if (!_cooked.has(recipeKey)) {
        _cooked.set(recipeKey, new Map());
      }
      var forR = _cooked.get(recipeKey);

      if (!forR.has(args[0])) {
        forR.set(args[0], new Map());
      }

      var forC = forR.get(args[0]);

      var argstring = "";
      var sep = "";
      for (var i = 1; i < args.length; ++i) {
        argstring = argstring + sep + args[i];
        sep =",";
      }

      if (forC.has(argstring)) return forC.get(argstring);

      console.log("Cooking " + recipeKey + " for " + argstring);

      var calculatedIngredients = new Object(null);
      $.each(loaded, function(i, ii) {
          calculatedIngredients[ii] = ingredients[ii](calculatedIngredients, args);
      });

      $.each(used, function(i, ii) {
          var _args = [];
          for (var j = 0; j < ii.args.length; ++j) {
            var s = TSAreplace(ii.args[j], calculatedIngredients);
            for (var k = 1; k < args.length; ++k) {
              s = s.split("$" + (k-1)).join(args[k]);
            }
            _args.push(s);
          }
          var _argstring = _args.join(",");
          _args.unshift(args[0]);

          calculatedIngredients[ii.key] = ingredients[ii.key](_args);
          _addUser( args[0],ii.recipe, _argstring, recipeKey,argstring);
      });

      var result = undefined;
      $.each(steps, function(s, step) {
        result = step(calculatedIngredients, args);
      });

      forC.set(argstring, result);

      return result;
  };

  _interpreted.set(recipeKey, f);
  return f;

}

c = {
  "Attribute" : {
    "KL": 12,
    "KK": 4
  },
  "Fertigkeiten" : {
    "laufen" : {
      "Attribute" : ["KL", "KL", "KK"],
      "fw" : 17
    }
  }
}


/*


TSArules = {
  "pw": {
    "arity": 1,
    "op": "sum",
    "parameters": [
      {
        "op": "get",
        "parameters": ["fw", "$0"]

      },
      {
        "op": "divide",
        "parameters": [
          {
            "op": "get",
            "parameters" : ["bw", "$0"]
          },
          2
        ]
      }
    ]
  },
  "fw" : {
    "arity": 1,
    "op" : "load",
    "parameters": ["$0.fw"]
  },
  "bw" : {
    "arity": 1,
    "op" : "divide",
    "parameters" : [
      {
        "op": "sum",
        "parameters" : {
              "op": "map-get",
              "parameters" : [
                "Attribut"
                ,
                {
                "op" : "get",
                "parameters": ["Attribute", "$0"]
                }
            ]
          }
      }
      ,
      3
    ]
  },
  "Attribut" : {
    "arity": "1",
    "op" : "load",
    "parameters" : ["Attribut.$0"]
  },
  "Attribute" : {
    "arity": "1",
    "op" : "load",
    "parameters" : ["$0.Attribute"]
  }

};


TSA = {
  _is_set: {},
  _getter: {},
  _val: {},
  _children: {},


  _call_listeners: function(key, character, args) {
    var argstring = args.join(",");
    if (!TSA._children[key].has(character)) return;
    $.each(
      TSA._children[key].get(character).get(argstring), function(k, kk) {
        TSA._is_set[kk.k].get(kk.c).set(kk.a.join(","), false);
        TSA._call_listeners(kk.k, kk.c, kk.a);
      }
    );

    TSA._children[key].get(character).set(argstring, []);

  },

  _touch: function(key, character, args) {

    var argstring = args.join(",");

    TSA._is_set[key].get(character).set(argstring,false);
    TSA._call_listeners(key, character, args);
  },
  get: {}
};

function TSAinitialize() {

  $.each(Object.keys(TsaRules), function(x, key) {
    if (!TsaRules.hasOwnProperty(key)) return;
    TSAaddRule(key);
  });

}

function TSAaddRule(key) {
  TSA._getter[key] = TSAaddRuleR(TSArules[key], key, TSArules[key].arity);
  TSA._is_set[key] = new Map();
  TSA._children[key] = new Map();
  TSA._val[key] = new Map();

  TSA.get[key] = function(character, args, callback = null) {

    var argstring = args.join(",");

    if (!(TSA._is_set[key].has(character))) {
      TSA._is_set[key].set(character, new Map());
    }
    if (!(TSA._is_set[key].get(character).get(argstring))) {
      console.log("Fresh computation: " + key + " " + argstring);
      if (!(TSA._val[key].has(character)))    TSA._val[key].set(character, new Map());
      TSA._val    [key].get(character).set(argstring, TSA._getter[key](character, args));
      TSA._is_set [key].get(character).set(argstring, true);
    }
    if (!(callback === null)) {
      if (!(TSA._children[key].has(character))) {
        TSA._children[key].set(character, new Map());
      }
      if (!(TSA._children[key].get(character).has(args))) {
        TSA._children[key].get(character).set(argstring, []);
      }
      TSA._children[key].get(character).get(argstring).push(callback);
    }
    return TSA._val[key].get(character).get(argstring);
  }
}

function TSAaddRuleR(rule, currentKey, arity) {

  if (!rule.hasOwnProperty("op")) {
    return function() {
      return rule;
    };
  }

  if (rule.op === "get") {
    var key = rule.parameters[0];
    return function(character, args) {
      var argsp = [];
      for (var k = 1; k < rule.parameters.length; ++k) {
        var argp = rule.parameters[k];
        for (var i = 0; i < Math.min(args.length, arity); ++i) {
          argp = argp.split("$" + i);
          argp = argp.join(args[i]);
        }
        argsp.push(argp);
      }
      return TSA.get[key](character, argsp, {k: currentKey, c: character, a: args});
    };
  }

  if (rule.op === "load") {
    return function(character, args) {
      var path = rule.parameters[0];
      for (var i = 0; i < Math.min(args.length, arity); ++i) {
        path =  path.split("$" + i).join(args[i]);
      }
      return TSAgoto(character, path);
    };

  }



      if (rule.op === "map-get") {
        return function(character, args) {
          var resultArray = [];
          var key = rule.parameters[0];
          var result = TSAaddRuleR(rule.parameters[1], currentKey, arity)(character, args);
          for (var k = 0; k < result.length; ++k) {
            resultArray.push(TSA.get[key](character, [result[k]], {k: currentKey, c: character, a: args}));
          }
          return resultArray;
        };
      }



  var functions = null;
  if (Array.isArray(rule.parameters)) {
    functions = [];
    for (var i = 0; i < rule.parameters.length; ++i) {
      functions.push(TSAaddRuleR(rule.parameters[i], currentKey, arity));
    }
  } else {
    functions = TSAaddRuleR(rule.parameters, currentKey, arity);
  }





  if (rule.op === "sum") {
    return function(character, args) {
      var r = 0;
      var result = null;
      if (!Array.isArray(functions)) {
        result = functions(character,args);
      }
      if (Array.isArray(functions)) {
        for (var i = 0; i < rule.parameters.length; ++i) {
            r = r + functions[i](character, args);
        }
      } else {
        for (var i = 0; i < result.length; ++i) {
          r = r + result[i];
        }
      }
      return r;
    };
  }

  if (rule.op === "divide") {
    return function(character, args = null) {
      var r = functions[0](character, args);
      for (var i = 1; i < rule.parameters.length; ++i) {
        r = r / functions[i](character, args);
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
*/
/*
TSAaddRule("Attribut");
TSAaddRule("Attribute");
TSAaddRule("bw");
TSAaddRule("fw");
TSAaddRule("pw");

c = {
  "Attribut": {"KK": 17, "MU": 2}, "laufen" : {"fw" : 3, "Attribute" : ["KK", "MU", "MU"]}
};
console.log(TSA.get["pw"](c, ["laufen"]));
TSA._touch("Attribut", c, ["KK"]);
console.log(TSA.get["pw"](c, ["laufen"]));
*/
