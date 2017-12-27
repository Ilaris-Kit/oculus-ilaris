TsaUI = {

  Characters: {},
  isInitialized: {},

  initialize: function() {
    console.log("Initializing TsaUI....");


    TsaUI.isInitialized["characterList"] = false;
    TsaUI.isInitialized["dropDownMenu"] = false;
    TsaUI.isInitialized["deleteCharacterButton"] = false;
    TsaUI.isInitialized["renamingCharacterButton"] = false;
    TsaUI.isInitialized["deletionModal"] = false;
    TsaUI.isInitialized["icons"] = false;

    var currentlySelected = TsaUI.updateCharacterList();

    TsaUI.updateCharacterSheet(currentlySelected);

    var br = "";
    $( ".currentCharacterLabel" ).each(function( index ) {
      $(this).html(br+ $(this).text() + ":&nbsp;");
      br = "<br>";
    });

    TsaUI.isInitialized["fileUploader"] = false;

    $("#addCharacterButtonLong, #addCharacterButton").click(function (e) {


      if (!TsaUI.isInitialized["fileUploader"]) {
        var fileInputButton = document.getElementById('uploadCharacter');
        var fileInputCancelButton = document.getElementById('cancelUploadCharacter');
        var fileInput = document.getElementById('fileInput');
        TsaUI.characterUploadCache = null;

        fileInput.addEventListener('change', function(e) {
          fileInputButton.disabled = (fileInput.files.length == 0);
          $("#fileInputLabel").text("");
          $("#fileInputLabel").css("display", "none");
          $("#fileInputWrapper").css("display", "block");
          TsaUI.characterUploadCache = null;

          if (fileInput.files.length > 0) {
            $("#fileInputLabel").text(fileInput.value.split('\\').pop());
            $("#fileInputLabel").css("display","block");
            $("#fileInputWrapper").css("display", "none");
            var file = fileInput.files[0];
            var textType = /text.*/;

            var reader = new FileReader();

            reader.onload = function(e) {
              TsaUI.characterUploadCache = getCharacterFromXML(reader.result);
              $("#fileInputLabel").text("\"" + TsaUI.characterUploadCache["Name"] + "\" aus \"" + TsaUI.characterUploadCache["Heimat"] + "\"");
            }

            reader.readAsText(file);

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
          fileInput.files = null;
          $("#fileInputLabel").text("");
          $("#fileInputLabel").css("display", "none");
          $("#fileInputWrapper").css("display", "block");

          TsaUI.updateCharacterSheet(TsaUI.updateCharacterList(addCharacterToLocalStorage(TsaUI.characterUploadCache)));


        });
        TsaUI.isInitialized["fileUploader"] = true;
      }

      $("#fileUploadModal").modal("show");

    });



    $( "#rebuildButton" ).click( function( event ) {
      initializeIlaris(function() {alert("Rebuilt");}, true);
    } );
    $( "#deleteAllButton" ).click( function( event ) {
      $.each(TsaUI.Characters, function(x, xx) {
        delete(TsaUI.Characters[x]);
      });
      TsaUI.updateCharacterSheet(TsaUI.updateCharacterList(deleteAllCharactersFromLocalStorage()));

    } );

    $( "#downloadButton" ).click( function( event ) {
      download(localStorageToJSON(), "ilarisLocalStorage.json","text/plain");
    } );
    var fileInputLS = document.getElementById('fileInputLS');

    fileInputLS.addEventListener('change', function(e) {
      var file = fileInputLS.files[0];
      var reader = new FileReader();

      reader.onload = function(e) {
        text = reader.result;
        JSONtoLocalStorage(text);
        TsaUI.updateCharacterSheet(TsaUI.updateCharacterList(null));
      }

      reader.readAsText(file);

    });


    $(document).on('click', 'a[href^="#tsa-table-copyrightNoticeIcons"]', function (event) {
      if ($("#tsa-table-copyrightNoticeIcons").css("display") === "none") {
        $("#tsa-table-copyrightNoticeIcons").css("display","block");
      } else {
        $("#tsa-table-copyrightNoticeIcons").css("display","none");
        event.preventDefault();
      }
    });

    $("#maintenance").removeClass("d-none");
    $("#tsa-icon-copyrights").removeClass("d-none");

    console.log("TsaUI loaded.");

  },


  updateCharacterList: function(newlyselected = null) {

    var currentlySelected = $("#characterList").val();
    var clist = getCharacterListFromLocalStorage();

    TsaUI.hasCharacters = (clist.length > 0);
    TsaUI.updateDeleteButton();

    var first = false;
    if (currentlySelected === null) {
      first = true;
    }

    $("#characterList").empty();
    $.each(clist, function( i, item ) {
      $("#characterList").append("<option>" + item + "</option>");
      if (TsaUI.Characters[item] === undefined) {
        TsaUI.Characters[item] = null;
      }
      if (first) {
        currentlySelected = item;
        first = false;
      }
    });

    if (!(TsaUI.isInitialized["characterList"])) {
      $( "#characterList" ).change( function( event ) {
        TsaUI.updateCharacterSheet($("#characterList").val());
      } );
      TsaUI.isInitialized["characterList"] = true;
    }


    TsaUI.MVcreatePFertigkeitenTable(TsaUI.Characters, clist);

    if (clist.length == 0) return null;

    if (!(newlyselected === null)) {
      currentlySelected = newlyselected;
    }

    $("#characterList").val(currentlySelected);


    return currentlySelected;
  },

  updateTextField: function(id,currentlySelected) {
    $("#currentCharacter" + id).text(TsaUI.Characters[currentlySelected][id]);
  },

  updateCharacterSheet: function(currentlySelected) {
    TsaUI.clearFields();
    if (currentlySelected === null) return;
    if (!TsaUI.Characters.hasOwnProperty(currentlySelected) || TsaUI.Characters[currentlySelected] === null) {
      TsaUI.Characters[currentlySelected] = getCharacterFromLocalStorage($("#characterList").val());
    }
    var currentCharacter = TsaUI.Characters[currentlySelected];
    var textfields = ["Name", "Rasse", "Status", "Kurzbeschreibung", "Finanzen", "Heimat", "EPtotal", "EPspent", "Schips"];
    $.each(textfields, function( i, item ) {
      TsaUI.updateTextField(item,currentlySelected);
    });

    $.each(currentCharacter["Eigenheiten"], function( i, item ) {
      $("#currentCharacterEigenheiten").append("<li>" + item + "</li>");
    });

    var lists = ["Eigenheiten","PFertigkeiten","KFertigkeiten","UFertigkeiten", "FFertigkeiten" ]

    var vorteileLists = {};

    $.each(["A", "P", "K", "S", "M", "R", "G", "T"], function (k, kat) {
      vorteileLists[kat] = [];
    });



    $.each(currentCharacter["Vorteile"], function( i, item ) {
      vorteileLists[Ilaris["Vorteile"][item]].push("<li>" + item + "</li>");
//      $("#currentCharacterVorteileListe").append("<li>" + item + "</li>");
    });

    var bezeichner = {"A": "Allgemeine Vorteile", "P": "Profane Vorteile", "K": "Kampfvorteile", "S": "Kampfstile", "M": "Magische Vorteile", "R": "Repräsentationen", "G": "Karmale Vorteile", "T": "Traditionen"};

    $.each(["A", "P", "K", "S", "M", "R", "G", "T"], function (k, kat) {
      if (vorteileLists[kat].length > 0) {
        lists.push("VorteileListe" + kat);
        $("#currentCharacterVorteileListe").append("<li><strong>" + bezeichner[kat] + "</strong><ul id=\"currentCharacterVorteileListe" + kat +"\">" + vorteileLists[kat].join("") + "</ul></li>");
      }
    });


    var attribute = {"CH": "Charisma", "IN": "Intution", "KL": "Klugheit", "MU": "Mut", "FF": "Fingerfertigkeit", "GE": "Gewandtheit", "KO": "Konstitution", "KK": "Körperkraft"};

    $.each(["CH","IN","KL","MU"], function(x,xx) {
      $("#currentCharacterEigenschaftenGeistig").append("<li>" + attribute[xx] + " (" + xx + ") " + currentCharacter[xx] + ", PW " + (parseInt(currentCharacter[xx])*2) + "</li>");
    });
    $.each(["FF","GE","KO","KK"], function(x,xx) {
      $("#currentCharacterEigenschaftenKörperlich").append("<li>" + attribute[xx] + " (" + xx + ") " + currentCharacter[xx] + ", PW " + (parseInt(currentCharacter[xx])*2) + "</li>");
    });

    /* Abgleitete Werte */

    var schipsTotal = 4;
    var ws = (4 + Math.floor(parseInt(currentCharacter["KO"]/4)));
    var mr = (4 + Math.floor(parseInt(currentCharacter["MU"]/4)));
    var gs = (4 + Math.floor(parseInt(currentCharacter["GE"]/4)));
    var ini = parseInt(currentCharacter["IN"]);
    var schadensbonus = Math.floor(parseInt(currentCharacter["KK"])/4);
    var asp = parseInt(currentCharacter["AsP"]);
    var kap = parseInt(currentCharacter["KaP"]);
    var be = 0;

    $.each(currentCharacter["Vorteile"], function (v, vv) {

      if ((vv === "Glück I") || (vv === "Glück II")) {
        schipsTotal = schipsTotal+1;
      }

      if ((vv === "Willensstark I") || (vv === "Willensstark II")) {
        mr = mr+4;
      }

      if ((vv === "Flink I") || (vv === "Flink II")) {
        gs = gs+1;
      }


      if (vv === "Unbeugsamkeit") {
        mr = mr + Math.round(currentCharakter["MU"]/2);
      }

      if (vv === "Unverwüstlich") {
        ws = ws+1;
      }

      if (vv === "Kampfreflexe") {
        ini = ini+4;
      }

      if ((vv === "Zauberer I") || (vv === "Zauberer II") || (vv === "Zauberer III") || (vv === "Zauberer IV")) {
        asp = asp+8;
      }

      if ((vv === "Geweiht I") || (vv === "Geweiht II") || (vv === "Geweiht III") || (vv === "Geweiht IV")) {
        kap = kap+8;
      }

      if ((vv === "Rüstungsgewöhnung I") || (vv === "Rüstungsgewöhung II")) {
        be = be -1;
      }


    });

    var zonen = ["Beine", "/ L. Arm", "/ R. Arm", "/ Bauch", "/ Brust", "/ Kopf"];
    var rs = [0,0,0,0,0,0];
    var zr = true;
    $.each(currentCharacter["Rüstungen"], function( r, rr) {
      be = be + parseInt(rr["be"]);
      if (zr && rr["rs"].length == 1) zr = false;
      for (var i = 0; i < rr["rs"].length; ++i) {
        rs[i] = rs[i] + parseInt(rr["rs"][i]);
      }
    });

    if (be < 0) be = 0;

    var dhstern = currentCharacter["KO"] - 2*be;
    var wsstern = rs[0];
    if (zr) {
      wsstern = "";
      for (var i = 0; i < zonen.length; ++i) {
          wsstern = wsstern + zonen[i] + " " + rs[i] + " ";
      }
    }
    var gsstern = gs - be;


    $("#currentCharacterSchipsTotal").text(schipsTotal);




    var abgeleitet = $("#currentCharacterAbgeleitet");
    abgeleitet.append("<li>Wundschwelle (WS) " + ws + "</li>");
    abgeleitet.append("<li>Wundschwelle* (WS*) " + wsstern + "</li>");
    abgeleitet.append("<li>Magieresistenz (MR) " + mr + "</li>");
    abgeleitet.append("<li>Geschwindigkeit (GS) " + gs + "</li>");
    abgeleitet.append("<li>Behinderung durch Rüstung (BE) " + be + "</li>");
    abgeleitet.append("<li>Geschwindigkeit* (GS*) " + gsstern + "</li>");
    abgeleitet.append("<li>Durchhaltevermögen (DH*) " + dhstern + "</li>");
    abgeleitet.append("<li>Initiative (INI) " + ini + "</li>");
    abgeleitet.append("<li>Schadensbonus " + schadensbonus + "</li>");
    if (asp > 0) abgeleitet.append("<li>Astralpunkte (AsP) total: " + asp + "</li>");
    if (kap > 0) abgeleitet.append("<li>Karmalpunkte (KaP) total: " + kap + "</li>");


    /*                  */


    $.each(Ilaris["PFertigkeiten"], function( i, item ) {
      var tlist = item["talente"];
      var selectedTalents = [];
      var otherTalents = [];
      $.each(tlist, function( ti, titem ) {
        if (currentCharacter["PTalente"][titem]["selected"]) {
          //$("#currentCharacterPTalente").append("<li><span class=\"selectedTalent\">" + titem + "</span>: PW(T) " + getProbenWertT(currentCharacter,i) + "</li>");
          selectedTalents.push("<li class=\"selectedTalent\">" + titem + "</li>" );
        } else {
          //$("#currentCharacterPTalente").append("<li><span class=\"otherTalent\">" + titem + "</span>: PW " + getProbenWert(currentCharacter,i) + "</li>");
          otherTalents.push("<li>" + titem + "</li>");
        }

      });

      var listring = "<li><span class=\"fertigkeit\">" + i + "</span>: ";
      listring = listring + "BW " + getBasisWert(currentCharacter,i);
      listring = listring + ", FW " + currentCharacter["PFertigkeiten"][i]["fw"];
      listring = listring + ", PW " + getProbenWert(currentCharacter,i);
      if (selectedTalents.length > 0) listring = listring +  "<br>Talente: PW(T) " + getProbenWertT(currentCharacter,i)+ "<ul>" + selectedTalents.join("") + "</ul>";

      listring = listring + "</li>";
      $("#currentCharacterPFertigkeiten").append(listring);
      //$("#currentCharacterPTalente").append("<li><span class=\"fertigkeit\">" + i + "</span>: PW " + getProbenWert(currentCharacter,i) + "</li>");
    });

    $("#currentCharacterKFertigkeiten").append("<li>Ungeübter Nahkampf: BW = PW " + Math.round((parseInt(currentCharacter["GE"]) + parseInt(currentCharacter["KK"]) + parseInt(currentCharacter["MU"]))/3) + "</li>");
    $("#currentCharacterKFertigkeiten").append("<li>Ungeübter Fernkampf: BW = PW " + Math.round((parseInt(currentCharacter["FF"]) + parseInt(currentCharacter["IN"]) + parseInt(currentCharacter["KK"]))/3) + "</li>");
    $.each(Ilaris["KFertigkeiten"], function( i, item ) {
      if (currentCharacter["KFertigkeiten"][i]["fw"] > 0) {
        var tlist = item["talente"];
        var selectedTalents = [];
        var otherTalents = [];
        $.each(tlist, function( ti, titem ) {
          if (currentCharacter["KTalente"][titem]["selected"]) {
            selectedTalents.push("<li class=\"selectedTalent\">" + titem + "</li>" );
          }

        });
        var listring = "<li><span class=\"fertigkeit\">" + i + "</span>: ";
        listring = listring + "BW " + getBasisWert(currentCharacter,i);
        listring = listring + ", FW " + currentCharacter["KFertigkeiten"][i]["fw"];
        listring = listring + ", PW " + getProbenWert(currentCharacter,i);
        if (selectedTalents.length > 0) listring = listring +  "<br>Talente: PW(T) " + getProbenWertT(currentCharacter,i)+ "<ul>" + selectedTalents.join("") + "</ul>";

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
            selectedTalents.push("<li class=\"selectedTalent\">" + titem + "</li>" );
          }

        });
        var listring = "<li><span class=\"fertigkeit\">" + i + "</span>: ";
        listring = listring + "BW " + getBasisWert(currentCharacter,i);
        listring = listring + ", FW " + currentCharacter["UFertigkeiten"][i]["fw"];
        if (selectedTalents.length > 0) listring = listring +  "<br>Spezialtalente: PW(T) " + getProbenWertT(currentCharacter,i)+ "<ul>" + selectedTalents.join("") + "</ul>";

        listring = listring + "</li>";
        $("#currentCharacterUFertigkeiten").append(listring);
      }
    });

    var freieFertigkeiten = "";
    $.each(currentCharacter["FFertigkeiten"], function(f, ff) {
      $("#currentCharacterFFertigkeiten").append("<li>" + f + " " + ff + "</li>");
    });



    var ruestungString = "-";
    if (currentCharacter["Rüstungen"].length > 0) {
      ruestungString = "<ul id=\"currentCharacterItemsRuestung\"></ul>";
      lists.push("ItemsRuestung");
    }
    var ruestungListe = $("<li>Rüstung: " + ruestungString + "</li>");
    $("#currentCharacterItemsListe").append(ruestungListe);
    $.each(currentCharacter["Rüstungen"], function(a, aa) {
      var listring = aa["name"] + ", BE " + aa["be"] + ", RS ";
      if (aa["rs"].length == 1) listring = listring + aa["rs"];
      else for (var i = 0; i < aa["rs"].length; ++i) {
        listring = listring + " " + zonen[i] + " " + aa["rs"][i];
      }
      $("#currentCharacterItemsRuestung").append("<li>" + listring + "</li>");
    });

    var waffenString = "-";
    if (currentCharacter["Waffen"].length > 0) {
      waffenString = "<ul id=\"currentCharacterItemsWaffen\"></ul>";
      lists.push("ItemsWaffen");
    }
    var waffenListe = $("<li>Waffen (Kampfstile nicht berücksichtigt): " + waffenString + "</li>");
    $("#currentCharacterItemsListe").append(waffenListe);
    var waffentyp = {"Nah": "Nahkampf", "Fern": "Fernkampf"};
    $.each(currentCharacter["Waffen"], function(a, aa) {
      var listring = aa["name"] + ", " +  waffentyp[aa["typ"]];
      listring = listring +  ", "+ aa["wuerfel"] + "w6";
      if (aa["bonus"] > 0) listring = listring + "+" + aa["bonus"];
      if (schadensbonus > 0 && aa["typ"] === "Nah") {
        var sb = schadensbonus;
        $.each(aa["eigenschaften"], function(x, xx) {
          if (xx === "Kopflastig") sb = 2*schadensbonus;
        });
        listring = listring + "(+" + sb + ")";
      }
      listring = listring + ", WM " + aa["wm"] + ", RW " + aa["rw"] + ", Härte " + aa["haerte"];
      if (aa["eigenschaften"].length > 0) listring = listring + ", <em>" + aa["eigenschaften"].join(", ") +  "</em>";
      $("#currentCharacterItemsWaffen").append("<li>" + listring + "</li>");
    });



    var ausruestungString = "-";
    if (currentCharacter["Ausrüstung"].length > 0) {
      ausruestungString = "<ul id=\"currentCharacterItemsAusruestung\"></ul>";
      lists.push("ItemsAusruestung");
    }
    var ausruestungListe = $("<li>Ausrüstung: " + ausruestungString + "</li>");
    $("#currentCharacterItemsListe").append(ausruestungListe);
    $.each(currentCharacter["Ausrüstung"], function(a, aa) {
      $("#currentCharacterItemsAusruestung").append("<li>" + aa + "</li>");
    });

    $.each(lists, function( i, item ) {
      TsaUI.sortList("#currentCharacter" + item);
    });
    var tr = $("<tr id=\"FTABLE-HEAD\"></tr>");
    tr.append($("<th scope=\"col\" colspan=3>Fertigkeit/Talent</th>"));
    tr.append($("<th scope=\"col\" style=\"text-align: right;\">PW/PW(T)</th>"));
    $("#FTABLE > thead").append(tr);

    TsaUI.createFertigkeitenTable(currentCharacter,"P");
    TsaUI.createFertigkeitenTable(currentCharacter,"K", true, true);
    TsaUI.createFertigkeitenTable(currentCharacter,"U", true, true, true);





  },


  sortList: function(listname) {
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
      ul.append(li);
    });

  },

  sortTableByRowHeader: function(tablenaming) {
    var items = $(tablenaming + ' > tbody > tr').get();
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
      $(tablenaming + " > tbody").append(li);
    });

  },

  sortTable: function(tablenaming, offset=0) {
    var items = $(tablenaming + ' > tbody > tr').get();
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
      $(tablenaming + " > tbody").append(li);
    });

  },


  clearFields: function() {
    var textfields = ["Name", "Rasse", "Status", "Kurzbeschreibung", "Finanzen", "Heimat", "EPtotal", "EPspent", "Schips", "SchipsTotal"];
    $.each(textfields, function( i, item ) {
      $("#currentCharacter" + item).text("");
    });
    var lists = ["Eigenheiten","VorteileListe","PFertigkeiten","KFertigkeiten","UFertigkeiten","PTalente","FFertigkeiten","EigenschaftenGeistig","EigenschaftenKörperlich","Abgeleitet", "ItemsListe" ]
    $.each(lists, function( i, item ) {
      $("#currentCharacter" + item).empty();
    });
    $("#FTABLE > tbody, #FTABLE > thead").empty();

  },


  createFertigkeitenTable: function(character, kategorie, selectedTalentsOnly = false, selectedFertigkeitenOnly = false, talentsOnly = false) {



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

          $("#FTABLE > tbody").append(TsaUI.createFertigkeitenRow(kategorie, titem, true,character[kategorie + "Talente"][titem]["selected"]).append(TsaUI.createFertigkeitenCell(pwt,false,false,true,character[kategorie + "Talente"][titem]["selected"])));
        }
      });
      if (!talentsOnly) {
        $("#FTABLE > tbody").append(TsaUI.createFertigkeitenRow(kategorie, i).append(TsaUI.createFertigkeitenCell(getProbenWert(character,i),false,false)));
      }
    });

    TsaUI.sortTable("#FTABLE");
  },
  createFertigkeitenRow: function(kategorie, fname,talent=false,selected=false) {

    var icon = $("<td id=\"ftable-" + fname + "-icon\" style=\"min-width: 2.5rem; width: 2.5rem; max-width: 2.5rem;\"></td>");
    var iconWrapper = $(TsaUI.getIcon(fname));


    icon.append(iconWrapper);

    var tr = $("<tr class=\"" + TsaUI.KategorieStil[kategorie] +  "\"></tr>");
    var th = $("<th class=\"" + TsaUI.KategorieStil[kategorie] + "\" scope=\"row\" style=\"min-width: 2rem; width: 2rem; max-width: 2rem;\"></th>");
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

    f.append(fWrapper);
    tr.append(f);
    tr.dblclick(function(e) {
      e.preventDefault();
      TsaUI.MVrollTheDice($("#MULTIVIEW-PFTABLE"), $(this), true);
    });

    return tr;
  },

  createFertigkeitenCell: function(pw,vorteil,eigenheit,talent=false,selected=false) {
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
  },

  KategorieStil: {
    P: "cat-p",
    K: "cat-k",
    U: "cat-u"
  },

  icons: {

  },

  getIcon: function(x) {
    if (!(TsaUI.isInitialized["icons"])) {
      TsaUI.initializeIcons();
      TsaUI.isInitialized["icons"] = true;
    }

    if (x in TsaUI.icons) {
      return "<div class=\"iconWrapper\"><span class=\"icon icon-" + TsaUI.icons[x] + "\"></span></div>";
    }
    return "";
  },

  initializeIcons: function() {
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
          TsaUI.icons[titem] = icon;
          if (kategorie == "P") {
            TsaUI.icons[titem] = icon + i;
          }
        });
        TsaUI.icons[i] = icon;
        if (kategorie == "P") {
          TsaUI.icons[i] = icon + i;
        }
      });
    });



  },






  MVcreatePFertigkeitenRow: function(fname,talent=false) {

    var kategorie = "P";
    var icon = $("<td id=\"MULTIVIEW-ftable-" + fname + "-icon\" style=\"min-width: 2.5rem; width: 2.5rem; max-width: 2.5rem;\"></td>");
    var iconWrapper = $(TsaUI.getIcon(fname));

    icon.append(iconWrapper);

    var tr = $("<tr class=\"" + TsaUI.KategorieStil[kategorie] +  "\"></tr>");
    var th = $("<th class=\"" + TsaUI.KategorieStil[kategorie] + "\" scope=\"row\"  style=\"min-width: 2rem; width: 2rem; max-width: 2rem;\"></th>");
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

    tr.dblclick(function(e) {
      e.preventDefault();
      TsaUI.MVrollTheDice($("#MULTIVIEW-PFTABLE"), $(this));
    });


    return tr;
  },


  MVcreatePFertigkeitenCell: function(fname,cname, pw,vorteil,eigenheit,talent=false,selected=false) {
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
  },


  MVcreatePFertigkeitenTable: function(characters, clist) {
    $("#MULTIVIEW-PFTABLE > tbody, #MULTIVIEW-PFTABLE > thead").empty();
    var tr = $("<tr id=\"MULTIVIEW-FTABLE-HEAD\"></tr>");
    tr.append($("<th scope=\"col\" colspan=3>Fertigkeit/Talent</th>"));
    $.each(clist, function( currentlySelected, currentlySelectedChar ) {
      var theChar = TsaUI.Characters[currentlySelectedChar];
      if (!TsaUI.Characters.hasOwnProperty(currentlySelectedChar) || TsaUI.Characters[currentlySelectedChar] === null) {
        theChar = getCharacterFromLocalStorage(currentlySelectedChar);
        TsaUI.Characters[currentlySelectedChar] = theChar;
      }
      tr.append($("<th scope=\"col\" style=\"text-align: right; padding-right: 1.5rem;\">" + theChar["Name"] + "</th>"));
    });
    $("#MULTIVIEW-PFTABLE > thead").append(tr);

    var kategorie = "P";
    $.each(Ilaris[kategorie + "Fertigkeiten"], function( i, item ) {
      var tlist = item["talente"];
      $.each(tlist, function( ti, titem ) {
        var pwt = -1;
        var sel = null;
        var tr = TsaUI.MVcreatePFertigkeitenRow(titem, true);
        $.each(clist, function( ci, citem ) {
          pwt = -1;
          var theChar = TsaUI.Characters[citem];
          var sel = theChar[kategorie + "Talente"][titem]["selected"];
          if (sel) {
            pwt = getProbenWertT(theChar,i);
          } else {
            pwt = getProbenWert(theChar,i);
          }
          var vorteileFertigkeit = TsaUI.intersection(theChar["Vorteile"], Ilaris[kategorie+ "Fertigkeiten"][i]["vorteile"]);
          var vorteilFertigkeit = vorteileFertigkeit.length > 0;
          var vorteileTalent = TsaUI.intersection(theChar["Vorteile"], Ilaris[kategorie+ "Talente"][titem]["vorteile"]);
          var vorteilTalent = vorteileTalent.length > 0;
          var newTD = TsaUI.MVcreatePFertigkeitenCell(titem,citem,pwt,vorteilFertigkeit || vorteilTalent,false,true,sel);
          var newSpan = $("<span class=\"d-none vorteile\"></span>");
          $.each(vorteileFertigkeit, function(v, vv) {
            newSpan.append("<li>" + vv + "</li>");
          });
          $.each(vorteileTalent, function(v, vv) {
            newSpan.append("<li>" + vv + "</li>");
          });
          newTD.append(newSpan);
          tr.append(newTD);
        });
        $("#MULTIVIEW-PFTABLE > tbody").append(tr);


      });
      var tr = TsaUI.MVcreatePFertigkeitenRow(i, false);
      $.each(clist, function( ci, citem ) {
        var theChar = TsaUI.Characters[citem];
        pwt = getProbenWert(theChar,i);
        var vorteileFertigkeit = TsaUI.intersection(theChar["Vorteile"], Ilaris[kategorie+ "Fertigkeiten"][i]["vorteile"]);
        var vorteilFertigkeit = vorteileFertigkeit.length > 0;
        var newSpan = $("<span class=\"d-none vorteile\"></span>");
        $.each(vorteileFertigkeit, function(v, vv) {
          newSpan.append("<li>" + vv + "</li>");
        });
        var newTD = TsaUI.MVcreatePFertigkeitenCell(i,citem,pwt,vorteilFertigkeit,false,false);
        newTD.append(newSpan);

        tr.append(newTD);
      });
      $("#MULTIVIEW-PFTABLE > tbody").append(tr);
    });

    TsaUI.sortTable("#MULTIVIEW-PFTABLE");

  },

  hasCharacters: false,

  updateDeleteButton: function() {

    if (!TsaUI.hasCharacters) {
      $("#addCharacterButtonLong").removeClass("d-none");
      $("#characterManager").addClass("d-none");
      $("#helpText").removeClass("d-none");
      $("#navigation").addClass("d-none");
      $("#tsa-tabcontent").addClass("importantHide");
      $("#dropDownMenu").val("#tsa-tab-single-sheet");
      $("#dropDownMenu").trigger("change");
    } else {
      if (!(TsaUI.isInitialized["deleteCharacterButton"])) {
        $( "#deleteCharacterButton" ).click( function( event ) {
          TsaUI.deletionModal($("#characterList").val(), function () {
            delete(TsaUI.Characters[$("#characterList").val()]);
            TsaUI.updateCharacterSheet(TsaUI.updateCharacterList(deleteCharacterFromLocalStorage($("#characterList").val())));
          })
        } );
        TsaUI.isInitialized["deleteCharacterButton"] = true;
      }
      if (!(TsaUI.isInitialized["renamingCharacterButton"])) {
        $( "#renamingCharacterButton" ).click( function( event ) {
          TsaUI.renamingModal($("#characterList").val(), function (newname) {
            TsaUI.updateCharacterSheet(TsaUI.updateCharacterList(renameCharacterFromLocalStorage(TsaUI.Characters[$("#characterList").val()], newname)));
          })
        } );
        TsaUI.isInitialized["renamingCharacterButton"] = true;
      }
      if (!(TsaUI.isInitialized["dropDownMenu"])) {
        $("#dropDownMenu").change( function (event) {
          $($("#dropDownMenu").val()).tab("show");
        });
        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
          $("#dropDownMenu").val("#" + $(e.target).attr("id"));
        });

        TsaUI.isInitialized["dropDownMenu"] = true;
      }


      $("#addCharacterButtonLong").addClass("d-none");
      $("#characterManager").removeClass("d-none");
      $("#helpText").addClass("d-none");
      $("#navigation").removeClass("d-none");
      $("#tsa-tabcontent").removeClass("importantHide");
    }

    $("#menu").removeClass("d-none");


  },

  MVrollTheDice: function(table,tr,current = false) {
    var chars = $("#currentCharacterName");
    var firstchar = 2;
    if (!current) {
      chars = table.children("thead").children("tr").children("th").get();
      firstchar = 1;
    }
    var tds = tr.children("td").get();
    var results = {};
    var ul = $("<ul></ul>");

    for (i = 2; i < tds.length; ++i) {
      var td = $(tds[i]);
      var pw = parseInt(td.text());
      var rolls = [TsaUI.getRandomInt(1,20), TsaUI.getRandomInt(1,20), TsaUI.getRandomInt(1,20)];
      var val = (rolls.sort( function(a,b) {return a - b;} ))[1];
      results[$(chars[i-firstchar]).text()] = {
        gewürfelt: rolls,
        gewertet: val,
        probenwert: pw,
        resultat: pw + val
      };


      var vlist = $("<ul></ul>");
      vlist.html(td.children("span.vorteile").html());
      var entry = $("<li><strong>" + $(chars[i-firstchar]).text() + ": " + (val+pw) + "</strong>, gewertet: " + val +  ". <br><small>PW/PW(T) = " + pw + ", Würfel = (" + rolls.join(",")  + ")</small><ul>" + vlist.html() + "</ul></li>");
      ul.append(entry);
    }
    $("#rollTheDiceModalHeaderH").text("Würfle auf " + $(tds[1]).text());
    $("#rollTheDiceModalBody").empty();
    $("#rollTheDiceModalBody").append(ul);
    $("#rollTheDiceModal").modal();



  },

  /**
  * Returns a random integer between min (inclusive) and max (inclusive)
  * Using Math.round() will give you a non-uniform distribution!
  https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
  */
  getRandomInt: function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  deletionModalCallback: null,
  renamingModalCallback: null,

  deletionModal: function(character, callback) {
    if (!(TsaUI.isInitialized["deletionModal"])) {
      $("#confirmDeletionButton" ).click( function( event ) {
        TsaUI.deletionModalCallback();
        TsaUI.deletionModalCallback = null;
      });
      TsaUI.isInitialized["deletionModal"] = true;

    }
    TsaUI.deletionModalCallback = callback;
    $("#deletionModalHeaderH").text(character + " wirklich entfernen?")
    $("#deletionModalBody").html("Soll der folgende Charakter tatsächlich entfernt werden? <br>\"" + TsaUI.Characters[character]["Name"] + "\" aus \"" + TsaUI.Characters[character]["Heimat"] + "\"");
    $("#deletionModal").modal();
  },

  renamingModal: function(character, callback) {
    if (!(TsaUI.isInitialized["renamingModal"])) {
      $("#confirmRenamingButton" ).click( function( event ) {
        TsaUI.renamingModalCallback($("#newName").val());
        TsaUI.renamingModalCallback = null;
      });
      TsaUI.isInitialized["renamingModal"] = true;
    }
    TsaUI.renamingModalCallback = callback;
    $("#renamingModalHeaderH").text(character + " umbenennen?");
    var renamingField = "<input id=\"newName\" type=\"text\" value=\"" + TsaUI.Characters[character]["Name"]  + "\">";
    $("#renamingModalBody").html("Soll der folgende Charakter tatsächlich umbenannt werden? <br>\"" + TsaUI.Characters[character]["Name"] + "\" aus \"" + TsaUI.Characters[character]["Heimat"] + "\"<br>" + renamingField);
    $("#renamingModal").modal();
  },


  intersection: function(a, b) {

    if (a === undefined) return [];
    if (b === undefined) return [];

    var t;
    if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
    return a.filter(function (e) {
      return b.indexOf(e) > -1;
    });
  },


  intersectionNonEmpty: function(a,b) {
    return (TsaUI.intersectArrays(a,b).length > 0);
  }

}
