SelectList = function() {

  var _list = {};
  var that = this;
  // list manipulation

  // Add a new element. By default do not select it.
  // By default, if the element is in the list, do not overwrite it.
  this.add = function(x, payload, selected = false, overwrite = false) {
    if (overwrite || !_contains(x)) {
      _list[x] = {sel: selected, p: payload};
      _invoke_list_listeners(x, true, selected, payload);
    }
  };

  // Remove an element and return it. By default, perform no further action.
  // If the element is not found, no action is performed and the function returns null.
  // If followup is set to a non-null value, the state of x is copied to the state of followup.
  // If followup is not null but not in the list, it is added.
  // The payload is NOT copied.
  this.remove = function(x, followup = null, add = false) {
    if (!_contains(x)) return null;
    if (followup != null) {
      if (add || (_contains(followup))) {
       _list[followup].sel = _get_state(x);
      }
    }
    _delete(x);
    return x;
  };

  this.empty = function() {
    _all(_delete);
  };

   var _delete = function(x) {
     delete _list[x];
     _invoke_list_listeners(x, false);
   };

   var _contains = function(x) {
     return (!(_list === undefined)) && (!(_list === null)) && (x in _list) && _list.hasOwnProperty(x);
   };

   // State manipulation

   // Return the state if x is found, otherwise null.
   this.set = function(x, selected) {
     if (!_contains(x)) return null;
     var oldstate = _get_state(x);
     _list[x].sel = selected;
     _invoke_state_listeners(x, selected, oldstate);
     return selected;
   };

   this.select = function(x) {
     return this.set(x, true);
   };

   this.unselect = function(x) {
     return this.set(x, false);
   };

   this.toggle = function(x) {
     if (!_contains(x)) return null;
     return this.set(x, !_get_state(x));
   };

   this.setAll = function(selected) {
     this.setL(Object.keys(_list), selected);
     return selected;
   };

   this.selectAll = function() {
     return this.setAll(true);
   };

   this.deselectAll = function() {
     return this.setAll(false);
   };

   this.toggleAll = function() {
     this.toggleL(Object.keys(_list));
   };

   var _all = function(f) {
     return _L(f,Object.keys(_list));
   };

   var _L = function(f, list) {
//     console.log("Executing: " + f + " for: ");
//     console.log(list);
     for (x in list) {
//       console.log("x: " + x);
       if (_contains(list[x])) {
//         console.log("Executing: " + f + " for " + list[x]);
         f(list[x]);
       }
     }
   };

   var _get_state = function(x) {
     return _list[x].sel;
   };

   var _clone_state = function(x) {
     if (_get_state(x)) return {sel: true};
     return {sel: false};
   };

   this.setL = function(list, selected) {
     _L(function(x) {
       that.set(x,selected);
     }, list);
   };

   this.selectL = function(list) {
     this.setL(list, true);
   };

   this.deselectL = function(list) {
     this.setL(list, false);
   };

   this.toggleL = function(list) {
     _L(function(x) {
       that.toggle(x);
     }, list);
   };

   this.plist = function() {
     console.log(JSON.stringify(_list));
   };
/*
   var _first_listener = null;
   var _last_listener = null;

   var _append_listener = function(i, f) {
     var nl = {
       id: i;
       callback: f;
       nxt: null;
     }
     if (_first_listener === null) {
       _first_listener = nl;
       _last_listener = nl;
     } else {
       _last_listener.nxt = nl;
     }
   }

   var _remove_listener = function(i) {
     var l = _first_listener;
     while (!(l === null)) {
       if (l.id == i) {

       }
     }
   }*/


   var _state_listeners = {};
   var _list_listeners = {};
   var _payload_listeners = {};

   var _invoke_state_listeners = function (x, n, o) {
     for (id in _state_listeners) {
       if (_state_listeners.hasOwnProperty(id)) {
         _state_listeners[id](x, n, o);
       }
     }
   }
   var _invoke_list_listeners = function (x, e, s, p) {
     for (id in _list_listeners) {
       if (_list_listeners.hasOwnProperty(id)) {
         _list_listeners[id](x, e, s, p);
       }
     }
   }
   var _invoke_payload_listeners = function (x, p) {
     for (id in _list_listeners) {
       if (_list_listeners.hasOwnProperty(id)) {
         _list_listeners[id](x, p);
       }
     }
   }

   this.addStateListener = function(id, f) {
     _state_listeners[id] = f;
   }

   this.removeStateListener = function(id) {
     delete _state_listeners[id];
   }

   this.addListListener = function(id, f) {
     _list_listeners[id] = f;
   }

   this.removeListListener = function(id) {
     delete _list_listeners[id];
   }
   this.addPayloadListener = function(id, f) {
     _payload_listeners[id] = f;
   }

   this.removePayloadListener = function(id) {
     delete _payload_listeners[id];
   }

   this.getKeys = function() {
     var result = [];
     var counter = 0;
     _all(function(x) {
       result[counter] = x;
       ++counter;
     });
     return result;
   }

   this.getState = function(x) {
     if (!_contains(x)) return null;
     return _get_state(x);
   }

   this.getStateL = function(list) {
     var result = {};
     _L(function(x) {
       result[x] = _clone_state(x);
     }, list);
     return result;
   }
   this.getAllStates = function() {
     return this.getStateL(Object.keys(_list));
   }


   this.get = function(x) {
     if (!_contains(x)) return null;
     return {sel: _get_state(x), p: _list[x].p};
   }

   this.getL = function(list) {
     var result = {};
     _L(function(x) {
       result[x] = that.get(x);
     }, list);
     return result;
   }
   this.getAll = function() {
     return this.getL(Object.keys(_list));
   }

   this.getAllPayloads = function() {
     return this.getPayloadL(Object.keys(_list));
   }


   // Payload manipulation

   this.getPayload = function(x) {
     return _list[x].p;
   }

   this.getPayloadL = function(list) {
     var result = {};
     _L(function(x) {
       result[x] = that.getPayload(x);
     }, list);
     return result;
   }

   this.setPayload = function(x, payload) {
     if (!_contains(x)) return undefined;
     _list[x].p = payload;
     _invoke_payload_listeners(x, payload);
     return _list[x].p;
   }
   this.removePayload = function(x) {
     delete _list[x].p;
     _list[x].p = null;
   }



}

l = new SelectList();
l.plist();

l.addStateListener("aha", function(x,newstate,oldstate) {
  console.log(x + " went from " + oldstate + " to " + newstate);
});
l.addListListener("aha", function(x,state,selected, payload) {
  if (state) {
    console.log(x + " has been added with sel state " +  selected + " and payload " + payload);
  } else {
    console.log(x + " has been deleted.");
  }
});


l.add("test2", "p2", true);
l.plist();l.add("test1", "p1", true);
l.plist();l.deselectAll();
l.plist();l.selectL(["test1", "test3"]);
l.plist();l.remove("test1");
l.plist();

l.set("test1", true);
l.plist();
l.toggle("test2");
l.plist();
l.toggleL(["test1", "test2"]);
l.plist();
list = l.getAll();
l.toggleL(["test1", "test2"]);
console.log(list);
console.log(l.getAllStates());

payload = {x: "hallo welt"};
l.add("h", payload);
console.log(l.getAllPayloads());
