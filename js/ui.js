UICharacters = {};

function UIinitialize() {
  console.log("Initializing UI...");
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
  } );

  var currentlySelected = UIupdateCharacterList();
  UIupdateCharacterSheet(currentlySelected);

  $( ".currentCharacterLabel" ).each(function( index ) {
    $(this).html("<br>" + $(this).text() + ":&nbsp;");
  });

  var fileInput = document.getElementById('fileInput');


  fileInput.addEventListener('change', function(e) {
    var file = fileInput.files[0];
    var textType = /text.*/;

    if (file.type.match(textType)) {
      var reader = new FileReader();

      reader.onload = function(e) {
        text = reader.result;
        UIupdateCharacterSheet(UIupdateCharacterList(addCharacterToLocalStorage(text)));
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

}


function UIupdateCharacterList(newlyselected = null) {
  var currentlySelected = $("#characterList").val();
  $("#characterList").empty();
  var clist = getCharacterListFromLocalStorage();
  if (clist.length == 0) return null;
  if (!(newlyselected === null)) {
    currentlySelected = newlyselected;
  }
  var first = false;
  if (currentlySelected === null) {
    first = true;
  }

  $.each(clist, function( i, item ) {
    $("#characterList").append("<option>" + item + "</option>");
    if (first) {
      currentlySelected = item;
      first = false;
    }
  });
  $("#characterList").val(currentlySelected);
  return currentlySelected;
}

function UIupdateTextField(id,currentlySelected) {
  $("#currentCharacter" + id).text(UICharacters[currentlySelected][id]);
}

function UIupdateCharacterSheet(currentlySelected) {
  UIclearFields();
  if (currentlySelected === null) return;
  if (!UICharacters.hasOwnProperty(currentlySelected)) {
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

function UIclearFields() {
  var textfields = ["Name", "Rasse", "Status", "Kurzbeschreibung", "Finanzen", "Heimat", "EPtotal", "EPspent"];
  $.each(textfields, function( i, item ) {
    $("#currentCharacter" + item).text("");
  });
  var lists = ["Eigenheiten","VorteileListe","PFertigkeiten","KFertigkeiten","UFertigkeiten","PTalente" ]
  $.each(lists, function( i, item ) {
    $("#currentCharacter" + item).empty();
  });
}
