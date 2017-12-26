Phex = {

  frontend: {
    probenliste: {
      initialized: false,
      element: undefined,
      byName: {},
      initialize: function() {
        var pl = Phex.frontend.probenliste.element = $("#probenListe");

        $.each(PhexCharacters, function(c, char) {
          Phex.frontend.probenliste.byName[char] = {
            element: undefined,
            pw: {
              element: undefined
            },
            req: {
              element: undefined
            },
            probability: {
              static: {
                element: undefined
              },
              dynamic: {
                element: undefined
              }
            },
            sg: {
              lbl: {
                element: undefined
              },
              mod: {
                element: undefined
              }
            },
            wuerfeln: {
              element: undefined
            },
            result: {
              element: undefined
            }
          };

          var forC = Phex.frontend.probenliste.byName[char].element = $("<li class=\"list-group-item d-flex justify-content-between align-items-center flex-wrap\" id=\"probenListeLi_" + char.hashCode() + "\"></li>");
          var forCName = $("<h4 class=\"w-100 d-flex justify-content-end align-items-center\"><span style=\"flex-grow: 1;\">" + char + "</span></h4>");
          var forCPW = Phex.frontend.probenliste.byName[char].pw.element = $("<span class=\"badge badge-primary badge-pill\" id=\"probenListeLiPW_" + char.hashCode() + "\"></span>")
          forCName.append(forCPW);
          var forCReq = Phex.frontend.probenliste.byName[char].req.element = $("<span id=\"probenListeLiReq_" + char.hashCode() + "\"></span>")
          forCReq.css("margin-right", "1rem");
          var forCProb = Phex.frontend.probenliste.byName[char].probability.static.element = $("<span id=\"probenListeLiProb_" + char.hashCode() + "\"></span>")
          forCProb.css("margin-right", "1rem");
          var forCProbDyn = Phex.frontend.probenliste.byName[char].probability.dynamic.element = $("<span id=\"probenListeLiProbDyn_" + char.hashCode() + "\"></span>")

          var formGrp = $("<form class=\"w-100\"></form>");
          var formDiv = $("<div class=\"form-group w-100\"></div>");
          var inputGrp = $("<div class=\"input-group\"></div>");


          var textAddon = Phex.frontend.probenliste.byName[char].sg.lbl.element = $("<span class=\"input-group-addon\" id=\"probenListAddon_" + char.hashCode() + "\">SG</span>");
          var inputField = Phex.frontend.probenliste.byName[char].sg.mod.element = $("<input class=\"form-control\" value =\"0\" type=\"number\">");
          Phex.frontend.probenliste.byName[char].sg.mod.val = 0;
          var updown = $("<span class=\"input-group-btn\"></span>");
          var down = $("<button class=\"btn btn-secondary\" type=\"button\">▼</button>");
          var up = $("<button class=\"btn btn-secondary\" type=\"button\">▲</button>");
          updown.append(down);
          updown.append(up);



          inputField.attr("id", "probenListModifier_" + char.hashCode());
          textAddon.text("SG +");
          textAddon.css("padding-right", "4px");
          inputField.css("padding-left", "4px");
          up.css("padding-left", "2px");
          up.css("padding-right", "3px");
          down.css("padding-left", "3px");
          down.css("padding-right", "2px");



          inputField.on("input", function() {
            var fine = (inputField[0].checkValidity());
            up.prop("disabled", !fine);
            down.prop("disabled", !fine);
            if (fine) inputField.removeClass("is-invalid");
            else inputField.addClass("is-invalid");
            if (fine) {
              Phex.frontend.probenliste.byName[char].sg.mod.val = parseInt(inputField.val());
              Phex.frontend.probenliste.update();
            } else {
              Phex.frontend.probenliste.byName[char].sg.mod.val = NaN;
              Phex.frontend.probenliste.update();
            }

          });

          inputField.change(function() {
            inputField.trigger("input");
          });



          down.on("click", function() {
            inputField.val(parseInt(inputField.val()) - 1);
            inputField.change();
          });

          up.on("click", function() {
            inputField.val(parseInt(inputField.val()) + 1);
            inputField.change();
          });

          var button = Phex.frontend.probenliste.byName[char].wuerfeln.element = $("<span class=\"input-group-btn\"><button class=\"btn btn-primary\" id=\"probenListeWuerfeln_" + char.hashCode() + "\">Würfeln</button></span>");


          forC.append(forCName);

          inputGrp.append(textAddon);
          inputGrp.append(inputField);
          inputGrp.append(updown);
          inputGrp.append(button);
          formDiv.append(inputGrp);
          formGrp.append(formDiv);
          forC.append(formGrp);

          forC.append(forCReq);
          forC.append(forCProb);
          forC.append(forCProbDyn);

          var resultDiv = Phex.frontend.probenliste.byName[char].result.element = $("<div class=\"w-100\" id=\"probenListeResult_" + char.hashCode() + "\"></div>")
          resultDiv.css("margin-top", "1rem");
          resultDiv.addClass("d-none");

          forC.append(resultDiv);
          button.on("click", function(e) {
            e.preventDefault();
            var pw = Phex.frontend.probenliste.byName[char].pw.val;
            var probe = new SimpleIlarisProbe(pw, 0);

            var sg = parseInt($("#fertigkeitSelectorModusText").val()) + Phex.frontend.probenliste.byName[char].sg.mod.val;

            if ($("#fertigkeitSelectorModusVP").prop("checked")) {
              var gp = new SimpleIlarisProbe(sg, 0);
              sg = gp.result().ew;
            }

            var result = probe.result();
            var ew = result.ew;
            var gewertet = ew - pw;
            var resultString = "<strong>";
            if (ew >= sg) {
              resultString = resultString + "Erfolg!";
              if (gewertet === 20) {
                resultString = resultString + " (Triumph!)";
              }
              resultDiv.removeClass("fehlschlag");
              resultDiv.addClass("erfolg");
            } else {
              resultString = resultString +  "Fehlschlag!";
              if (gewertet === 1) {
                resultString = resultString + " (Patzer!)";
              }
              resultDiv.removeClass("erfolg");
              resultDiv.addClass("fehlschlag");
            }
            resultString = resultString + "</strong> EW " + ew + " vs " + sg + ".<br>Ergebnisse: " + result.rolls.toString() + ", gewertete "  + gewertet + ".";
            resultDiv.html(resultString);
            resultDiv.removeClass("d-none");

          });


          probenListeEntries.set(char, forC);
          pl.append(forC);
        });
      },
      update: function() {
        if (!Phex.frontend.probenliste.initialized) {
          Phex.frontend.probenliste.initialize();
          Phex.frontend.probenliste.initialized = true;
        }
        var pl = Phex.frontend.probenliste.element;

        var toption = $("#fertigkeitSelectorTalente").children("option:selected");

        if (toption.length === 0) return;
        var kategorie = toption.attr("data-kategorie");
        var f = toption.attr("data-fertigkeit");
        var t = toption.val().split(" [")[0];

        var dc = parseInt($("#fertigkeitSelectorModusText").val());
        var sg = true;
        if ($("#fertigkeitSelectorModusVP").prop("checked")) {
          dc = dc + 10;
          sg = false;
        }

        var keepdc = dc;
        $.each(PhexCharacters, function(c, charname) {
          dc = keepdc;

          var char = PhexCharacterObjects(charname);
          var pw = getProbenWert(char, f);
          var pwPref = "PW ";

          Phex.frontend.probenliste.byName[charname].sg.lbl.element.text($("#fertigkeitSelectorModusText").val() + " +");

          var mod = Phex.frontend.probenliste.byName[charname].sg.mod.val;

          dc = dc + mod;


          var talentClass = "badge-primary";
          if ($("#fertigkeitSelectorTalente").hasClass("usethis") && (char[kategorie+"Talente"][t].selected)) {
            pw = getProbenWertT(char,f);
            pwPref = "PW(T) "
            talentClass = "badge-success";
          }
          if ($("#fertigkeitSelectorTalente").hasClass("usethis") && (!char[kategorie+"Talente"][t].selected)) {
            talentClass = "badge-danger";
          }



          if (isNaN(dc)) {
            Phex.frontend.probenliste.byName[charname].req.element.addClass("d-none");
            Phex.frontend.probenliste.byName[charname].probability.static.element.addClass("d-none");
            Phex.frontend.probenliste.byName[charname].probability.dynamic.element.addClass("d-none");
          } else {
            Phex.frontend.probenliste.byName[charname].req.element.removeClass("d-none");
            Phex.frontend.probenliste.byName[charname].probability.static.element.removeClass("d-none");
            Phex.frontend.probenliste.byName[charname].probability.dynamic.element.removeClass("d-none");

            var reqNr = Math.max(0, Math.ceil(dc-pw));
            if (reqNr > 20) {
              reqNr = -1;
            }
            var chance = 100;
            var chanceDyn = 100;

            for (var i = 0; i < reqNr-1; ++i) {
              chance = chance - probabilities[i];
            }
            if (!sg) {
              var dcalt = dc -10;
              var differenz = pw - dcalt;
              var scwahrscheinlichkeit = -1;
              if (differenz <= 20) {
                scwahrscheinlichkeit = 0;
                for (var sc = 0; sc < 20; ++sc) {
                  scw = sc+differenz;
                  nscwahrscheinlichkeit = 100;
                  if (scw >= 0) {
                    nscwahrscheinlichkeit = 0;
                    for (var nsc = scw+1; nsc < 20; ++nsc) {
                      nscwahrscheinlichkeit = nscwahrscheinlichkeit + probabilities[nsc];
                    }
                  }
                  scwahrscheinlichkeit = scwahrscheinlichkeit + probabilities[sc]/100 * (100-nscwahrscheinlichkeit);
                }
                chanceDyn = scwahrscheinlichkeit;

              }
            }

            chance = chance.toFixed(2);

            Phex.frontend.probenliste.byName[charname].pw.val = pw;
            Phex.frontend.probenliste.byName[charname].pw.element.text(pwPref + pw).removeClass("badge-danger").removeClass("badge-success").removeClass("badge-primary").addClass(talentClass);

            if (reqNr >= 0) {
              Phex.frontend.probenliste.byName[charname].req.element.text("Benötigt (statisch): " + reqNr);
              Phex.frontend.probenliste.byName[charname].probability.static.element.text("Erfolgswahrscheinlichkeit (statisch): " + chance + "%");
            } else {
              Phex.frontend.probenliste.byName[charname].req.element.text("Erfolg (statisch) nicht möglich.");
              Phex.frontend.probenliste.byName[charname].probability.static.element.text("");
            }

            if (sg) {
              Phex.frontend.probenliste.byName[charname].probability.dynamic.element.addClass("d-none");
            } else {
              if (chanceDyn > 0) {
                chanceDyn = chanceDyn.toFixed(2);
                Phex.frontend.probenliste.byName[charname].probability.dynamic.element.text("Erfolgswahrscheinlichkeit (dynamisch): " + chanceDyn + "%");
              } else {
                Phex.frontend.probenliste.byName[charname].probability.dynamic.element.text("Erfolg (dynamisch) nicht möglich.");
              }
              Phex.frontend.probenliste.byName[charname].probability.dynamic.element.removeClass("d-none");
            }
          }

        });


      }


    }
  }


}
