function getCharacterFromLocalStorage(character) {
  return JSON.parse(localStorage.getItem("characters"))[character];
}

function renameCharacterFromLocalStorage(character, newname) {
  deleteCharacterFromLocalStorage(character["Name"]);
  character["Name"] = newname;
  return addCharacterToLocalStorage(character);
}

function addCharacterToLocalStorage(newCharacter) {
  if (localStorage.getItem("characters") === null) {
    localStorage.setItem("characters", JSON.stringify({}));
  }
  c = JSON.parse(localStorage.getItem("characters"));

  c[newCharacter["Name"]] = newCharacter;
  localStorage.setItem("characters",JSON.stringify(c));

  return newCharacter["Name"];
}
function deleteCharacterFromLocalStorage(s) {
  if (localStorage.getItem("characters") === null) {
    return null;
  }
  c = JSON.parse(localStorage.getItem("characters"));
  delete c[s];
  localStorage.setItem("characters",JSON.stringify(c));
  if (Object.keys(c).length > 0) {return Object.keys(c)[0]};
  return null;
}

function deleteAllCharactersFromLocalStorage(s) {
  localStorage.removeItem("characters");
  return null;
}



function getCharacterListFromLocalStorage() {
  if (localStorage.getItem("characters") === null) {
    localStorage.setItem("characters", JSON.stringify({}));
  }
  return Object.keys(JSON.parse(localStorage.getItem("characters")));
}

function getRulesFromLocalStorage() {
  return $($.parseXML(localStorage.getItem("rules")));
}

function localStorageToJSON() {
  return JSON.stringify({"rules" : localStorage.getItem("rules"), "Ilaris" : JSON.parse(localStorage.getItem("Ilaris")), "characters" : JSON.parse(localStorage.getItem("characters"))} );
}

function JSONtoLocalStorage(json) {
  var ls = JSON.parse(json);
  localStorage.setItem("rules",JSON.stringify(ls["rules"]));
  localStorage.setItem("Ilaris",JSON.stringify(ls["Ilaris"]));
  localStorage.setItem("characters", JSON.stringify(ls["characters"]));
}
