


function getCharacterFromXML(s) {
  result = {};

  Charakter = $($.parseXML(s)).find("Charakter");
  var AllgemeineInfos = Charakter.find("AllgemeineInfos");

  var fromText = {};
  fromText["Name"] = AllgemeineInfos.find("name");
  fromText["Kurzbeschreibung"] = AllgemeineInfos.find("kurzbeschreibung");
  fromText["Heimat"] = AllgemeineInfos.find("heimat");
  fromText["Rasse"] = AllgemeineInfos.find("rasse");


  result["Status"] = getStatusString(AllgemeineInfos.find("status").text());
  result["Finanzen"] = getFinanzenString(AllgemeineInfos.find("finanzen").text());

  var Eigenheiten = AllgemeineInfos.find("eigenheiten").find("Eigenheit");
  result["Eigenheiten"] = [];
  $.each(Eigenheiten, function( i, item ) {
    if (!($(item).text() === "")) {
      result["Eigenheiten"].push($(item).text());
    }
  });

  fromText["Schips"] = AllgemeineInfos.find("schips");
  result["AsP"] = $(Charakter.find("Energien").find("AsP")).attr("wert");
  result["KaP"] = $(Charakter.find("Energien").find("KaP")).attr("wert");

  var Erfahrung = Charakter.find("Erfahrung");
  fromText["EPtotal"] = Erfahrung.find("EPtotal");
  fromText["EPspent"] = Erfahrung.find("EPspent");

  var Attribute = Charakter.find("Attribute");

  $.each(Ilaris["Attribute"], function( i, item ) {
    fromText[item] = Attribute.find(item);
  });

  var Vorteile = Charakter.find("Vorteile").find("Vorteil");
  result["Vorteile"] = [];
  $.each(Vorteile, function( i, item ) {
    if (!($(item).text() === "")) {
      result["Vorteile"].push($(item).text());
    }
  });

  result["KFertigkeiten"] = {};
  result["PFertigkeiten"] = {};
  result["UFertigkeiten"] = {};
  //  var rulesFertigkeiten = rules.find("Datenbank").find("Fertigkeit");
  $.each(Ilaris["KFertigkeiten"], function( i, item ) {
    result["KFertigkeiten"][i] = {"fw" : 0};
  });
  $.each(Ilaris["PFertigkeiten"], function( i, item ) {
    result["PFertigkeiten"][i] = {"fw" : 0};
  });
  $.each(Ilaris["UFertigkeiten"], function( i, item ) {
    result["UFertigkeiten"][i] = {"fw" : 0};
  });

  result["PTalente"] = {};
  result["KTalente"] = {};
  result["UTalente"] = {};
  $.each(Ilaris["PTalente"], function( i, item ) {
    result["PTalente"][i] = {"selected" : false};
  });
  $.each(Ilaris["KTalente"], function( i, item ) {
    result["KTalente"][i] = {"selected" : false};
  });
  $.each(Ilaris["UTalente"], function( i, item ) {
    result["UTalente"][i] = {"selected" : false};
  });


  var Fertigkeiten = Charakter.find("Fertigkeiten").find("Fertigkeit");
  $.each(Fertigkeiten, function( i, item ) {
    fName = $(item).attr("name");
    if (Ilaris["PFertigkeiten"].hasOwnProperty(fName)) {
      result["PFertigkeiten"][fName]["fw"] = $(item).attr("wert");
    } else {
      result["KFertigkeiten"][fName]["fw"] = $(item).attr("wert");
    }
    var Talente = $(item).find("Talente").find("Talent");
    $.each(Talente, function( ti, titem ) {
      tname = IlarisCleanupTalent($(titem).attr("name"));
      if (Ilaris["PTalente"].hasOwnProperty(tname)) {
        result["PTalente"][tname]["selected"] = true;
      } else {
        result["KTalente"][tname]["selected"] = true;
      }
    });
  });
  var UFertigkeiten = Charakter.find("Übernatürliche-Fertigkeiten").find("Übernatürliche-Fertigkeit");
  $.each(UFertigkeiten, function( i, item ) {
    fName = $(item).attr("name");
    result["UFertigkeiten"][fName]["fw"] = $(item).attr("wert");
    var Talente = $(item).find("Talente").find("Talent");
    $.each(Talente, function( ti, titem ) {
      result["UTalente"][IlarisCleanupTalent($(titem).attr("name"))]["selected"] = true;
    });
  });


  $.each(fromText, function( i, item ) {
    result[i] = item.text();
  });

  return result;
}



function getStatusString(id) {
//This method converts the Status ID to a readable string
  var statusArray = {};
  statusArray["4"] = "Abschaum";
  statusArray["3"] = "Unterschicht";
  statusArray["2"] = "Mittelschicht";
  statusArray["1"] = "Oberschicht";
  statusArray["0"] = "Elite";
  return statusArray[id];
}

function getFinanzenString(id) {

  var finanzenArray = {};
  finanzenArray["4"] = "Sehr arm";
  finanzenArray["3"] = "Arm";
  finanzenArray["2"] = "Normal";
  finanzenArray["1"] = "Reich";
  finanzenArray["0"] = "Sehr reich";
  return finanzenArray[id];
}

function getBasisWert(character, fertigkeit) {
  var result = 0;
  for (var kategorie of ["P","K","U"]) {
    if (Ilaris[kategorie + "Fertigkeiten"].hasOwnProperty(fertigkeit)) {
      $.each(Ilaris[kategorie + "Fertigkeiten"][fertigkeit]["Attribute"], function( i, item ) {
        result = result + parseInt(character[item]);
      });
      return Math.round(result/3);
    }
  }
  return -1;
}

function getProbenWert(character, fertigkeit) {
  var result = getBasisWert(character,fertigkeit);
  for (let kategorie of ["P","K","U"]) {
    if (Ilaris[kategorie+"Fertigkeiten"].hasOwnProperty(fertigkeit)) {
        result = result + Math.round(parseInt(character[kategorie + "Fertigkeiten"][fertigkeit]["fw"])/2);
        return result;
      }
  }
  return -1;
}
function getProbenWertT(character, fertigkeit) {
  var result = getBasisWert(character,fertigkeit);
  for (var kategorie of ["P","K","U"])
  if (Ilaris[kategorie+"Fertigkeiten"].hasOwnProperty(fertigkeit)) {
      result = result + parseInt(character[kategorie + "Fertigkeiten"][fertigkeit]["fw"]);
      return result;
  }
  return -1;
}


function encode_utf8(s) {
  return unescape(encodeURIComponent(s));
}

function decode_utf8(s) {
  return decodeURIComponent(escape(s));
}
