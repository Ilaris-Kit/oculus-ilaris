UICharacters = {};

function UIinitialize() {
  console.log("Initializing UI...");

  var first = true;
  $.each($("#tsa-tablist > li > a"), function(x,xitem) {
    var text = $(xitem).text().trim();
    $("#dropDownMenu").append("<option value=\"#" + $(xitem).attr("id") + "\">" + text + "</option>");
  });

$("#dropDownMenu").change( function (event) {
    $($("#dropDownMenu").val()).tab("show");
  });

/*  $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    var old = null;
    var n = null;
    if ($(e.target).attr("id").endsWith("md")) {
        n = $("#" + $(e.target).attr("id").split("-md")[0]);
        old = $("#" + $(e.relatedTarget).attr("id").split("-md")[0]);
    } else {
      n = $("#" + $(e.target).attr("id") + "-md");
      old = $("#" + $(e.relatedTarget).attr("id") + "-md");
    }
    console.log(old.hasClass("active"));
    console.log(n.hasClass("active"));

    old.removeClass("active");
    n.addClass("active");

  });*/

  $( "#rebuildButton" ).click( function( event ) {
    initializeIlaris(function() {alert("Rebuilt");}, true);
  } );
  $( "#deleteAllButton" ).click( function( event ) {
    UIupdateCharacterSheet(UIupdateCharacterList(deleteAllCharactersFromLocalStorage()));

  } );
  $( "#deleteCharacterButton" ).click( function( event ) {
    UIupdateCharacterSheet(UIupdateCharacterList(deleteCharacterFromLocalStorage($("#characterList").val())));

  } );
  $( "#downloadButton" ).click( function( event ) {
    download(localStorageToJSON(), "ilarisLocalStorage.json","text/plain");
  } );

  $( "#characterList" ).change( function( event ) {
    UIupdateCharacterSheet($("#characterList").val());
    updateDeleteButton();
  } );


  UIinitializeIcons();

  var currentlySelected = UIupdateCharacterList();
  UIupdateCharacterSheet(currentlySelected);
  var br = "";
  $( ".currentCharacterLabel" ).each(function( index ) {
    $(this).html(br+ $(this).text() + ":&nbsp;");
    br = "<br>";
  });

  var fileInputButton = document.getElementById('uploadCharacter');
  var fileInputCancelButton = document.getElementById('cancelUploadCharacter');
  var fileInput = document.getElementById('fileInput');
  fileInput.addEventListener('change', function(e) {
    fileInputButton.disabled = (fileInput.files.length == 0);
    $("#fileInputLabel").text("");
    $("#fileInputLabel").css("display", "none");
    $("#fileInputWrapper").css("display", "block");

    if (fileInput.files.length > 0) {
      $("#fileInputLabel").text(fileInput.value.split('\\').pop());
      $("#fileInputLabel").css("display","block");
      $("#fileInputWrapper").css("display", "none");
    }

  });
  fileInputCancelButton.addEventListener('click', function(e) {
    fileInputButton.disabled = true;
    fileInput.files = null;
    $("#fileInputLabel").text("");
    $("#fileInputLabel").css("display", "none");
    $("#fileInputWrapper").css("display", "block");
  });


  fileInputButton.addEventListener('click', function(e) {

    if (fileInput.files.length == 0) return;

    var file = fileInput.files[0];
    var textType = /text.*/;

    if (file.type.match(textType)) {
      var reader = new FileReader();

      reader.onload = function(e) {
        text = reader.result;
        UIupdateCharacterSheet(UIupdateCharacterList(addCharacterToLocalStorage(text)));
        fileInput.files = null;
        $("#fileInputLabel").text("");
        $("#fileInputLabel").css("display", "none");
        $("#fileInputWrapper").css("display", "block");
      }

      reader.readAsText(file);
    }

  });

  var fileInputLS = document.getElementById('fileInputLS');

  fileInputLS.addEventListener('change', function(e) {
    var file = fileInputLS.files[0];
    var reader = new FileReader();

    reader.onload = function(e) {
      text = reader.result;
      JSONtoLocalStorage(text);
      UIupdateCharacterSheet(UIupdateCharacterList(null));
    }

    reader.readAsText(file);

  });

  console.log("UI Loaded.");

}


function UIupdateCharacterList(newlyselected = null) {
  var currentlySelected = $("#characterList").val();
  $("#characterList").empty();
  var clist = getCharacterListFromLocalStorage();
  var first = false;
  if (currentlySelected === null) {
    first = true;
  }

  $.each(clist, function( i, item ) {
    $("#characterList").append("<option>" + item + "</option>");
    if (UICharacters[item] === undefined) {
      UICharacters[item] = null;
    }
    if (first) {
      currentlySelected = item;
      first = false;
    }
  });

  for (var c in UICharacters) {
    if (UICharacters.hasOwnProperty(c) && !(clist.includes(c))) {
      delete UICharacters[c];
    }
  }
  UIMVcreatePFertigkeitenTable(UICharacters);
  updateDeleteButton();


  if (clist.length == 0) return null;

  if (!(newlyselected === null)) {
    currentlySelected = newlyselected;
  }

  $("#characterList").val(currentlySelected);
  updateDeleteButton();


  return currentlySelected;
}

function UIupdateTextField(id,currentlySelected) {
  $("#currentCharacter" + id).text(UICharacters[currentlySelected][id]);
}

function UIupdateCharacterSheet(currentlySelected) {
  UIclearFields();
  if (currentlySelected === null) return;
  if (!UICharacters.hasOwnProperty(currentlySelected) || UICharacters[currentlySelected] === null) {
    UICharacters[currentlySelected] = getCharacterFromLocalStorage($("#characterList").val());
  }
  var currentCharacter = UICharacters[currentlySelected];
  var textfields = ["Name", "Rasse", "Status", "Kurzbeschreibung", "Finanzen", "Heimat", "EPtotal", "EPspent"];
  $.each(textfields, function( i, item ) {
    UIupdateTextField(item,currentlySelected);
  });

  $.each(currentCharacter["Eigenheiten"], function( i, item ) {
    $("#currentCharacterEigenheiten").append("<li>" + item + "</li>");
  });

  $.each(currentCharacter["Vorteile"], function( i, item ) {
    $("#currentCharacterVorteileListe").append("<li>" + item + "</li>");
  });

  $.each(Ilaris["PFertigkeiten"], function( i, item ) {
    var tlist = item["talente"];
    var selectedTalents = [];
    var otherTalents = [];
    $.each(tlist, function( ti, titem ) {
      if (currentCharacter["PTalente"][titem]["selected"]) {
        $("#currentCharacterPTalente").append("<li><span class=\"selectedTalent\">" + titem + "</span>: PW(T) " + getProbenWertT(currentCharacter,i) + "</li>");
        selectedTalents.push("<span class=\"selectedTalent\">" + titem + "</span>" );
      } else {
        $("#currentCharacterPTalente").append("<li><span class=\"otherTalent\">" + titem + "</span>: PW " + getProbenWert(currentCharacter,i) + "</li>");
        otherTalents.push(titem);
      }

    });
    var listring = "<li><span class=\"fertigkeit\">" + i + "</span>: " + selectedTalents.join(", ");
    if (selectedTalents.length > 0 && otherTalents.length > 0) listring = listring +  ", ";
    listring = listring +  otherTalents.join(", ");
    listring = listring + "; BW: " + getBasisWert(currentCharacter,i);
    listring = listring + "; FW: " + currentCharacter["PFertigkeiten"][i]["fw"];
    listring = listring + "; PW: " + getProbenWert(currentCharacter,i);
    listring = listring + "; PW(T): " + getProbenWertT(currentCharacter,i);
    listring = listring + "</li>";
    $("#currentCharacterPFertigkeiten").append(listring);
    $("#currentCharacterPTalente").append("<li><span class=\"fertigkeit\">" + i + "</span>: PW " + getProbenWert(currentCharacter,i) + "</li>");
  });

  $.each(Ilaris["KFertigkeiten"], function( i, item ) {
    if (currentCharacter["KFertigkeiten"][i]["fw"] > 0) {
      var tlist = item["talente"];
      var selectedTalents = [];
      var otherTalents = [];
      $.each(tlist, function( ti, titem ) {
        if (currentCharacter["KTalente"][titem]["selected"]) {
          selectedTalents.push("<span class=\"selectedTalent\">" + titem + "</span>" );
        }

      });
      var listring = "<li><span class=\"fertigkeit\">" + i + "</span>: " + selectedTalents.join(", ");
      if (selectedTalents.length > 0 && otherTalents.length > 0) listring = listring +  ", ";
      listring = listring +  otherTalents.join(", ");
      listring = listring + "; BW: " + getBasisWert(currentCharacter,i);
      listring = listring + "; FW: " + currentCharacter["KFertigkeiten"][i]["fw"];
      listring = listring + "; PW: " + (Math.round(parseInt(currentCharacter["KFertigkeiten"][i]["fw"])/2) + getBasisWert(currentCharacter,i));
      listring = listring + "; PW(T): " + (Math.round(parseInt(currentCharacter["KFertigkeiten"][i]["fw"])) + getBasisWert(currentCharacter,i));
      listring = listring + "</li>";

      $("#currentCharacterKFertigkeiten").append(listring);
    }
  });

  $.each(Ilaris["UFertigkeiten"], function( i, item ) {
    if (currentCharacter["UFertigkeiten"][i]["fw"] > 0) {
      var tlist = item["talente"];
      var selectedTalents = [];
      var otherTalents = [];
      $.each(tlist, function( ti, titem ) {
        if (currentCharacter["UTalente"][titem]["selected"]) {
          selectedTalents.push("<span class=\"selectedTalent\">" + titem + "</span>" );
        }

      });
      var listring = "<li><span class=\"fertigkeit\">" + i + "</span>: " + selectedTalents.join(", ");
      if (selectedTalents.length > 0 && otherTalents.length > 0) listring = listring +  ", ";
      listring = listring +  otherTalents.join(", ");
      listring = listring + "; BW: " + getBasisWert(currentCharacter,i);
      listring = listring + "; FW: " + currentCharacter["UFertigkeiten"][i]["fw"];
      listring = listring + "; PW: " + (Math.round(parseInt(currentCharacter["UFertigkeiten"][i]["fw"])/2) + getBasisWert(currentCharacter,i));
      listring = listring + "; PW(T): " + (Math.round(parseInt(currentCharacter["UFertigkeiten"][i]["fw"])) + getBasisWert(currentCharacter,i));
      listring = listring + "</li>";

      $("#currentCharacterUFertigkeiten").append(listring);
    }
  });

  var lists = ["Eigenheiten","VorteileListe","PFertigkeiten","KFertigkeiten","UFertigkeiten", "PTalente" ]
  $.each(lists, function( i, item ) {
    UIsortList("#currentCharacter" + item);
  });
  $("#FTABLE > thead").append($("<th scope=\"col\" colspan=3>Fertigkeit/Talent</th>"));
  $("#FTABLE > thead").append($("<th scope=\"col\" style=\"text-align: right;\">PW/PW(T)</th>"));

  UIcreateFertigkeitenTable(currentCharacter,"P");
  UIcreateFertigkeitenTable(currentCharacter,"K", true, true);
  UIcreateFertigkeitenTable(currentCharacter,"U", true, true, true);





}


function UIsortList(listname) {
  var items = $(listname  + ' > li').get();
  items.sort(function(a,b){
    var keyA = $(a).text().split(": ")[0];
    var keyB = $(b).text().split(": ")[0];

    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;

    if ($(a).html() < $(b).html().split(": ")[0]) return -1;
    if ($(a).html() > $(b).html().split(": ")[0]) return 1;
    return 0;
  });
  var ul = $(listname);
  $.each(items, function(i, li){
    ul.append(li); /* This removes li from the old spot and moves it */
  });

}

function UIsortTableByRowHeader(tablename) {
  var items = $(tablename + ' > tbody > tr').get();
  items.sort(function(a,b){
    var keyA = $($(a).children("th")[0]).text().split(": ")[0];
    var keyB = $($(b).children("th")[0]).text().split(": ")[0];

    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;

    if ($(a).html() < $(b).html().split(": ")[0]) return -1;
    if ($(a).html() > $(b).html().split(": ")[0]) return 1;
    return 0;
  });
  $.each(items, function(i, li){
    $(tablename + " > tbody").append(li);
  });

}

function UIsortTable(tablename, offset=0) {
  var items = $(tablename + ' > tbody > tr').get();
  items.sort(function(a,b){
    var tdcounter = offset;
    while (tdcounter < $(a).children("th, td").length) {
      keyA = $($(a).children("th, td")[tdcounter]).text();
      keyB = $($(b).children("th, td")[tdcounter]).text();
      if (keyA < keyB) return -1;
      if (keyA > keyB) return 1;
      tdcounter = tdcounter+1;
    }


    return 0;
  });
  $.each(items, function(i, li){
    $(tablename + " > tbody").append(li);
  });

}


function UIclearFields() {
  var textfields = ["Name", "Rasse", "Status", "Kurzbeschreibung", "Finanzen", "Heimat", "EPtotal", "EPspent"];
  $.each(textfields, function( i, item ) {
    $("#currentCharacter" + item).text("");
  });
  var lists = ["Eigenheiten","VorteileListe","PFertigkeiten","KFertigkeiten","UFertigkeiten","PTalente" ]
  $.each(lists, function( i, item ) {
    $("#currentCharacter" + item).empty();
  });
  $("#FTABLE > tbody, #FTABLE > thead").empty();

}


function UIcreateFertigkeitenTable(character, kategorie, selectedTalentsOnly = false, selectedFertigkeitenOnly = false, talentsOnly = false) {



  $.each(Ilaris[kategorie + "Fertigkeiten"], function( i, item ) {
    if (selectedFertigkeitenOnly && character[kategorie + "Fertigkeiten"][i]["fw"] == 0) return;
    var tlist = item["talente"];
    $.each(tlist, function( ti, titem ) {
      var pwt = -1;
      if (character[kategorie + "Talente"][titem]["selected"]) {
        pwt = getProbenWertT(character,i)
      } else {
        pwt = getProbenWert(character,i);
      }
      if (character[kategorie + "Talente"][titem]["selected"] || (!(new RegExp(".*\\(.*").test(titem)) && !selectedTalentsOnly)) {

        $("#FTABLE > tbody").append(UIcreateFertigkeitenRow(kategorie, titem, true,character[kategorie + "Talente"][titem]["selected"]).append(UIcreateFertigkeitenCell(pwt,false,false,true,character[kategorie + "Talente"][titem]["selected"])));
      }
    });
    if (!talentsOnly) {
      $("#FTABLE > tbody").append(UIcreateFertigkeitenRow(kategorie, i).append(UIcreateFertigkeitenCell(getProbenWert(character,i),false,false)));
    }
  });

  UIsortTable("#FTABLE");
}
function UIcreateFertigkeitenRow(kategorie, fname,talent=false,selected=false) {

  var icon = $("<td id=\"ftable-" + fname + "-icon\" style=\"min-width: 2.5rem; width: 2.5rem; max-width: 2.5rem;\"></td>");
  var iconWrapper = $(UIgetIcon(fname));
  /*
  if (talent) {
  iconWrapper.append($("<span class=\"isTalent indicator indicator-bottom indicator-left\"></span>"));
  if (selected) {
  iconWrapper.append($("<span class=\"isSelected indicator indicator-bottom indicator-right\"></span>"));
}

} else {
iconWrapper.append($("<span class=\"isFertigkeit indicator indicator-bottom indicator-left\"></span>"));
}*/

icon.append(iconWrapper);

var tr = $("<tr class=\"" + UIKategorieStil[kategorie] +  "\"></tr>");
var th = $("<th class=\"" + UIKategorieStil[kategorie] + "\" scope=\"row\" style=\"min-width: 2rem; width: 2rem; max-width: 2rem;\"></th>");
var thWrapper = $("<div style=\"position: relative; padding: 0; padding-right: 1.2rem;text-align: left; display: inline-block;\">" + kategorie + "</div>");
if (talent) {
  if (selected) {
    thWrapper.append($("<span class=\"isSelected indicator indicator-bottom indicator-right\"></span>"));
  } else {
    thWrapper.append($("<span class=\"notSelected indicator indicator-bottom indicator-right\"></span>"));
  }
} else {
  thWrapper.append($("<span class=\"isFertigkeit indicator indicator-bottom indicator-right\"></span>"));
}

th.append(thWrapper);
tr.append(th);
tr.append(icon);
var f = $("<td id=\"ftable-" + fname + "-name\"></td>");
var fWrapper = $("<span style=\"position: relative; padding: 0; padding-right: 0rem; display: inline-block;\">" + fname + "</span>");
/*if (talent) {
if (selected) {
fWrapper.append($("<span class=\"isSelected indicator indicator-bottom indicator-right\"></span>"));
}
}*/
f.append(fWrapper);
tr.append(f);

return tr;
}

function UIcreateFertigkeitenCell(pw,vorteil,eigenheit,talent=false,selected=false) {
  var newWrapper = $("<div class=\"probenwertWrapper\"></div>");
  var newProbenwert = $("<div class=\"probenwert\">" + pw + "</div>");
  newWrapper.append(newProbenwert);
  if (vorteil) {
    newWrapper.append($("<span class=\"hasVorteil indicator indicator-top indicator-right\"></span>"));
  }
  if (eigenheit) {
    newWrapper.append($("<span class=\"hasEigenheit indicator indicator-top indicator-left\"></span>"));
  }
  return $("<td style=\"text-align: right;\"></td>").append(newWrapper);
}

UIKategorieStil = {
  P: "cat-p",
  K: "cat-k",
  U: "cat-u"
}

UIicons = {

}

function UIgetIcon(x) {
  if (x in UIicons) {
    return "<div class=\"iconWrapper\"><span class=\"icon icon-" + UIicons[x] + "\"></span></div>";
  }
  return "";
}

function UIinitializeIcons() {
  $.each(["K","P","U"], function( k, kategorie ) {

    var icon = "";
    if (kategorie == "K") {
      icon = icon + "K";
    }
    if (kategorie == "U") {
      icon = icon + "U";
    }

    $.each(Ilaris[kategorie + "Fertigkeiten"], function( i, item ) {
      var tlist = item["talente"];
      $.each(tlist, function( ti, titem ) {
        UIicons[titem] = icon;
        if (kategorie == "P") {
          UIicons[titem] = icon + i;
        }
      });
      UIicons[i] = icon;
      if (kategorie == "P") {
        UIicons[i] = icon + i;
      }
    });
  });



}






function UIMVcreatePFertigkeitenRow(fname,talent=false) {

  var kategorie = "P";
  var icon = $("<td id=\"MULTIVIEW-ftable-" + fname + "-icon\" style=\"min-width: 2.5rem; width: 2.5rem; max-width: 2.5rem;\"></td>");
  var iconWrapper = $(UIgetIcon(fname));

  icon.append(iconWrapper);

  var tr = $("<tr class=\"" + UIKategorieStil[kategorie] +  "\"></tr>");
  var th = $("<th class=\"" + UIKategorieStil[kategorie] + "\" scope=\"row\"  style=\"min-width: 2rem; width: 2rem; max-width: 2rem;\"></th>");
  var thWrapper = $("<div style=\"position: relative; padding: 0; padding-right: 1.2rem;text-align: left; display: inline-block;\">" + kategorie + "</div>");
  if (talent) {
    thWrapper.append($("<span class=\"isTalent indicator indicator-bottom indicator-right\"></span>"));
  } else {
    thWrapper.append($("<span class=\"isFertigkeit indicator indicator-bottom indicator-right\"></span>"));
  }

  th.append(thWrapper);
  tr.append(th);
  tr.append(icon);
  var f = $("<td id=\"MULTIVIEW-ftable-" + fname + "-name\"></td>");
  var fWrapper = $("<span style=\"position: relative; padding: 0; padding-right: 0rem; display: inline-block;\">" + fname + "</span>");
  f.append(fWrapper);
  tr.append(f);

  return tr;
}


function UIMVcreatePFertigkeitenCell(fname,cname, pw,vorteil,eigenheit,talent=false,selected=false) {
  var newWrapper = $("<div class=\"probenwertWrapper\"></div>");
  var newProbenwert = $("<div class=\"probenwert\">" + pw + "</div>");
  newWrapper.append(newProbenwert);
  if (vorteil) {
    newWrapper.append($("<span class=\"hasVorteil indicator indicator-top indicator-right\"></span>"));
  }
  if (eigenheit) {
    newWrapper.append($("<span class=\"hasEigenheit indicator indicator-top indicator-left\"></span>"));
  }
  if (talent && selected) {
    newWrapper.append($("<span class=\"isSelected indicator indicator-bottom indicator-right\"></span>"));
  }
  return $("<td style=\"text-align: right;\" id=\"MULTIVIEW-ftable-" + fname + "-" + cname + " \"></td>").append(newWrapper);
}


function UIMVcreatePFertigkeitenTable(characters) {
  $("#MULTIVIEW-PFTABLE > tbody, #MULTIVIEW-PFTABLE > thead").empty();
  $("#MULTIVIEW-PFTABLE > thead").append($("<th scope=\"col\" colspan=3>Fertigkeit/Talent</th>"));
  $.each(characters, function( currentlySelected, currentlySelectedChar ) {
    // console.log("I found a character: ");
    //console.log(currentlySelected);
    if (!UICharacters.hasOwnProperty(currentlySelected) || UICharacters[currentlySelected] === null) {
      UICharacters[currentlySelected] = getCharacterFromLocalStorage(currentlySelected);
    }
    $("#MULTIVIEW-PFTABLE > thead").append($("<th scope=\"col\" style=\"text-align: right; padding-right: 1.5rem;\">" + UICharacters[currentlySelected]["Name"] + "</th>"));
  });

  var kategorie = "P";
  $.each(Ilaris[kategorie + "Fertigkeiten"], function( i, item ) {
    var tlist = item["talente"];
    $.each(tlist, function( ti, titem ) {
      var pwt = -1;
      var sel = null;
      var tr = UIMVcreatePFertigkeitenRow(titem, true);
      $.each(characters, function( ci, citem ) {
        //console.log("Lookup for character: " + ci);
        //console.log(citem);
        pwt = -1;
        sel = null;
        if (citem[kategorie + "Talente"][titem]["selected"]) {
          pwt = getProbenWertT(citem,i);
          sel = true;
        } else {
          pwt = getProbenWert(citem,i);
          sel = false;
        }
        tr.append(UIMVcreatePFertigkeitenCell(titem,ci,pwt,false,false,true,sel));
      });
      $("#MULTIVIEW-PFTABLE > tbody").append(tr);
    });
    var tr = UIMVcreatePFertigkeitenRow(i, false);
    $.each(characters, function( ci, citem ) {
      pwt = getProbenWert(citem,i);
      tr.append(UIMVcreatePFertigkeitenCell(i,ci,pwt,false,false,false));
    });
    $("#MULTIVIEW-PFTABLE > tbody").append(tr);
  });

  //UIsortTable("#MULTIVIEW-PFTABLE");
}

function updateDeleteButton() {
  if ($("#characterList").val() === null) {
    $("#deleteCharacterButton").addClass("d-none");
    $("#characterList").addClass("d-none");
    $("#helpText").removeClass("d-none");
  } else {
    $("#deleteCharacterButton").html("Delete " + $("#characterList").val());
    $("#characterList").removeClass("d-none");
    $("#deleteCharacterButton").removeClass("d-none");
    $("#helpText").addClass("d-none");
  }

}
