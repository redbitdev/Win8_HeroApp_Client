(function () {
    WinJS.Namespace.define("Locations", {
        // array of locations to display on the map and list
        locations: [],

        // the list to show in the list view
        locationList: new WinJS.Binding.List(),

        // unfiltered locations when in list view
        unfilteredLocations: [],

        // the current location of the user
        currentLocation: null,

        // the selected pin POI 
        selectedPoi: null,

        // the last directions state returned
        lastDirectionsstate: null,

        // the view boundries for the last location
        lastDirectionsViewBoundries: null,

        // server settings
        serverSettings: 
            {
                allowAnonIssues: true,
                allowAnonCommenting: true,
                autoApproveIssues: false,
                autoApproveComments: false,
            }
    });

    WinJS.Namespace.define("Finder.Data", {
        search: function (query) {
            var ret = [];
            for (var i = 0; i < Locations.locations.length; i++) {
                var poi = Locations.locations[i];
                if (poi[Finder.Config.nameField].toLowerCase().indexOf(query.toLowerCase()) !== -1 || poi[Finder.Config.secondaryField].toLowerCase().indexOf(query.toLowerCase()) !== -1)
                    //get around the name field issue.
                    //poi['name'] = poi[Finder.Config.nameField];
                    ret.push(poi);
            }
            return ret;
        },
        filter: function (field, query) {
            var ret = [];
            for (var i = 0; i < Locations.locations.length; i++) {
                var poi = Locations.locations[i];
                if (poi[field].toLowerCase().indexOf(query.toLowerCase()) !== -1)
                    ret.push(poi);
            }
            Locations.locations = ret;
        },
        recalcDistances: function () {

            var coord = Locations.currentLocation;

            //go through and calc the distance
            for (var i = 0; i < Locations.locations.length; i++) {
                var poi = Locations.locations[i];

                Locations.locations[i].distance = getDistanceFromLatLonInKm(poi[Finder.Config.latitudeField], poi[Finder.Config.longidudeField], coord.latitude, coord.longitude);
            }
        },

        // gets the settings fromthe server
        getSettings: function () {
            return WinJS.xhr({ url: Finder.Config.settingsUrl + "?rdm=" + Math.random() }).then(function (response) {
                Locations.serverSettings = JSON.parse(response.responseText);
                return Locations.serverSettings;
            });
        },

        getData: function () {
            return WinJS.xhr({ url: Finder.Config.staticUrl + "?rdm=" + Math.random() }).then(function (response) {
                var text = response.responseText;

                if (Finder.Config.jsonpCallback) {
                    var callbackName = Finder.Config.jsonpCallback;

                    text = text.substring(callbackName.length + 1, text.length - 1);
                }

                var data = JSON.parse(text);
                var ret = [];
                var path = Finder.Config.pathToObject;

                if (Finder.Config.pathToArray) {
                    data = data[Finder.Config.pathToArray];
                }

                if (Finder.Config.pathToObject) {
                    var index = 0;
                    var s = data[index++];


                    while (s !== undefined) {
                        for (var i = 0; i < path.length; i++) {
                            s = s[path[i]];
                        }
                        ret.push(s);
                        s = data[index++];
                    };
                }
                else
                    ret = data;


                if (Finder.Config.objectParser) {
                    var newRet = new Array();
                    for (var i = 0; i < ret.length; i++) {
                        var o = Finder.Config.objectParser(ret[i]);
                        if (o) newRet.push(o);
                    }

                    ret = newRet;
                }


                Locations.locations = ret;
                if (!ret)
                    Locations.locations = [];
                Locations.locationList = new WinJS.Binding.List(ret);

                Finder.Data.recalcDistances();
                Locations.unfilteredLocations = ret;
                return ret;
            });
        },
        dynamicSort: function(property) {
            var sortOrder = 1;
            if (property[0] === "-") {
                sortOrder = -1;
                property = property.substr(1, property.length - 1);
            }
            return function (a, b) {
                var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
                return result * sortOrder;
            }
        }
    });

    

    function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2 - lat1);  // deg2rad below
        var dLon = deg2rad(lon2 - lon1);
        var a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return d.toFixed(2);
    }

    function deg2rad(deg) {
        return deg * (Math.PI / 180)
    }
})()