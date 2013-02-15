// Seperated the function as the main home.js was getting way to big

(function () {
    "use strict";

    WinJS.Namespace.define("Finder.Home", {
        // the main bing map
        map: null,

        // bing maps geolocation provider
        geoLocationProvider: null,

        // holds the gps information on the map, primarly the circle that bing sdk shows for location
        gpsLayer: null,

        // layer to hold the route information
        routeLayer: null,

        // layer to hold the pins
        poiLayer: null,

        // the location pin of the user
        locationPin: null,

        //The location being used for a new issue
        pickPin: null,

        //layer to hold the info box
        infoBoxLayer: null,

        // popup for information on the pin
        infoBox: null,

        // determins if searching for directions is in progress
        directionsInProgress: null,

        initialBounds:null,

        // the poi pin layer element from bing maps
        poiLayerElement: function () {
            var root = findProperty(Finder.Home.poiLayer, '_er_etr');
            return root;
        },

        // the station layer element
        routeLayerElement: function () {
            var root = findProperty(Finder.Home.routeLayer, '_er_etr');
            return root;
        },

        // the infobox layer element
        infoBoxLayerElement: function () { return $('.Infobox2')[0]; },
    });

    // hack function to find the property in an EntityCollection whcih contains the html node
    function findProperty(prop, keypart) {
        for (var key in prop) {
            if (key.indexOf(keypart) > -1) {
                return prop[key].root;
            }
        }
        return undefined;
    }
})();