function getIlarisFromRulesXML() {
  var ilaris = {};

  var rules = getRulesFromLocalStorage();


  ilaris["KFertigkeiten"] = {};
  ilaris["PFertigkeiten"] = {};
  var rulesFertigkeiten = rules.find("Datenbank").find("Fertigkeit");
  $.each(rulesFertigkeiten, function( i, item ) {
    fName = $(item).attr("name");
    var currentFertigkeit = {"talente" : []};
    currentFertigkeit["Attribute"] = $(item).attr("attribute").split("|");
    if ($(item).attr("kampffertigkeit") == "1" || fName === "Schusswaffen" || fName === "Wurfwaffen") {
      ilaris["KFertigkeiten"][fName] = currentFertigkeit;
    } else {
      ilaris["PFertigkeiten"][fName] = currentFertigkeit;
    }
  });
  ilaris["UFertigkeiten"] = {};
  var rulesUFertigkeiten = rules.find("Datenbank").find("Übernatürliche-Fertigkeit");
  $.each(rulesUFertigkeiten, function( i, item ) {
    fName = $(item).attr("name");
    var currentFertigkeit = {"talente" : []};
    currentFertigkeit["Attribute"] = $(item).attr("attribute").split("|");
    ilaris["UFertigkeiten"][fName] = currentFertigkeit;
  });


  ilaris["PTalente"] = {};
  ilaris["KTalente"] = {};
  ilaris["UTalente"] = {};
  var rulesTalente = rules.find("Datenbank").find("Talent");
  $.each(rulesTalente, function( i, item ) {
    fName = IlarisCleanupTalent($(item).attr("name"));
    fertigkeiten = $(item).attr("fertigkeiten");
    if (ilaris["PFertigkeiten"].hasOwnProperty(fertigkeiten)) {
      ilaris["PTalente"][fName] = {"fertigkeiten" : fertigkeiten};
      ilaris["PFertigkeiten"][fertigkeiten]["talente"].push(fName);
    } else if (ilaris["KFertigkeiten"].hasOwnProperty(fertigkeiten)) {
      ilaris["KTalente"][fName] = {"fertigkeiten" : fertigkeiten};
      ilaris["KFertigkeiten"][fertigkeiten]["talente"].push(fName);
    }
    else {
      ilaris["UTalente"][fName] = {"fertigkeiten" : fertigkeiten.split(", ")};
      $.each(fertigkeiten.split(", "), function( i, item ) {
        if (ilaris["UFertigkeiten"].hasOwnProperty(item)) {
          ilaris["UFertigkeiten"][item]["talente"].push(fName);
        } else {
          console.log("Warning: Found non-existent Fertigkeit \"" + item + "\" in Talent " + fName);
        }
      });
    }
  });

  ilaris["Attribute"] = ["KO", "MU", "GE", "KK", "IN", "KL", "CH", "FF"];

  return ilaris;
}

Ilaris = {};

function initializeIlaris(callback, rebuild = false) {

  IlarisLocal = localStorage.getItem("Ilaris");
  if (rebuild || IlarisLocal === null) {
    if (rebuild || localStorage.getItem("rules") === null) {
      $.ajax({
      					 type: "GET",
      					 url: "https://raw.githubusercontent.com/Aeolitus/Sephrasto/master/datenbank.xml",
      					 cache: false,
      					 dataType: "xml",
      					 success: function(xml) {
                    localStorage.setItem("rules",(new XMLSerializer()).serializeToString(xml));
                    console.log("Pulled from github");
                    Ilaris = getIlarisFromRulesXML();
                    localStorage.setItem("Ilaris", JSON.stringify(Ilaris));
                    return finalizeCallback(callback);
      						}
      			 });
      return;
    } else {
      Ilaris = getIlarisFromRulesXML();
      localStorage.setItem("Ilaris", JSON.stringify(Ilaris));
      return finalizeCallback(callback);
    }
  }
  Ilaris = JSON.parse(IlarisLocal);
  return finalizeCallback(callback);
}

function IlarisCleanupTalent(talent) {
  if (talent.split(": ").length > 1) {
    return talent.split(": ").join(" (") + ")";
  }
  return talent;
}

function finalizeCallback(callback) {

  $.each(IlarisVorteile, function(i,item) {
    $.each(item, function(j,jitem) {
      $.each(jitem["for"], function(f, fertigkeit) {
        $.each(["P", "U", "K"], function (k, kategorie) {
          if (fertigkeit in Ilaris[kategorie + "Fertigkeiten"]) {
            if (!("vorteile" in Ilaris[kategorie + "Fertigkeiten"][fertigkeit])) {
              Ilaris[kategorie + "Fertigkeiten"][fertigkeit]["vorteile"] = [];
              Ilaris[kategorie + "Fertigkeiten"][fertigkeit]["vorteile-mode"] = [];
              Ilaris[kategorie + "Fertigkeiten"][fertigkeit]["vorteile-object"] = [];
              Ilaris[kategorie + "Fertigkeiten"][fertigkeit]["vorteile-target"] = [];
              Ilaris[kategorie + "Fertigkeiten"][fertigkeit]["vorteile-if"] = [];
            }
            Ilaris[kategorie + "Fertigkeiten"][fertigkeit]["vorteile"].push(i);
            if ("inc" in jitem) {
              Ilaris[kategorie + "Fertigkeiten"][fertigkeit]["vorteile-mode"].push("inc");
              Ilaris[kategorie + "Fertigkeiten"][fertigkeit]["vorteile-object"].push(jitem["inc"]);
              Ilaris[kategorie + "Fertigkeiten"][fertigkeit]["vorteile-target"].push(jitem["by"]);
            } else if ("set" in jitem) {
              Ilaris[kategorie + "Fertigkeiten"][fertigkeit]["vorteile-mode"].push("set");
              Ilaris[kategorie + "Fertigkeiten"][fertigkeit]["vorteile-object"].push(jitem["set"]);
              Ilaris[kategorie + "Fertigkeiten"][fertigkeit]["vorteile-target"].push(jitem["to"]);
            }
            Ilaris[kategorie + "Fertigkeiten"][fertigkeit]["vorteile-if"].push(jitem["if"]);

            }
        });
        $.each(["P", "U", "K"], function (k, kategorie) {
          if (fertigkeit in Ilaris[kategorie + "Talente"]) {
            if (!("vorteile" in Ilaris[kategorie + "Talente"][fertigkeit])) {
              Ilaris[kategorie + "Talente"][fertigkeit]["vorteile"] = [];
              Ilaris[kategorie + "Talente"][fertigkeit]["vorteile-mode"] = [];
              Ilaris[kategorie + "Talente"][fertigkeit]["vorteile-object"] = [];
              Ilaris[kategorie + "Talente"][fertigkeit]["vorteile-target"] = [];
              Ilaris[kategorie + "Talente"][fertigkeit]["vorteile-if"] = [];

            }
            Ilaris[kategorie + "Talente"][fertigkeit]["vorteile"].push(i);
            if ("inc" in jitem) {
              Ilaris[kategorie + "Talente"][fertigkeit]["vorteile-mode"].push("inc");
              Ilaris[kategorie + "Talente"][fertigkeit]["vorteile-object"].push(jitem["inc"]);
              Ilaris[kategorie + "Talente"][fertigkeit]["vorteile-target"].push(jitem["by"]);
            } else if ("set" in jitem) {
              Ilaris[kategorie + "Talente"][fertigkeit]["vorteile-mode"].push("set");
              Ilaris[kategorie + "Talente"][fertigkeit]["vorteile-object"].push(jitem["set"]);
              Ilaris[kategorie + "Talente"][fertigkeit]["vorteile-target"].push(jitem["to"]);
            }
            Ilaris[kategorie + "Talente"][fertigkeit]["vorteile-if"].push(jitem["if"]);
          }
        });

      })
    })
  });

  console.log(Ilaris);

  return callback();
}
