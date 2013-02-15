// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/searchLocation/searchLocation.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            //wire up the search button
            buttonSearch.onclick = searchLocation;
            document.getElementById("textLocation").innerText = "";
            document.getElementById("resultsView").innerHTML = "";
        },

        unload: function () {
            // TODO: Respond to navigations away from this page.
        },

        updateLayout: function (element, viewState, lastViewState) {
            /// <param name="element" domElement="true" />

            // TODO: Respond to changes in viewState.
        }
    });

    function searchLocation() {
        var query = document.getElementById('textLocation').value;

        if (!query) {
            var msg = new Windows.UI.Popups.MessageDialog("You must enter a value to search for");
            msg.showAsync();
            return;
        }


        Geo.geocode(query).then(function (results) {
            //display the results
            var resultTemplate = new WinJS.Binding.Template(document.getElementById("resultTemplate"));
            var resultsContainer = document.getElementById("resultsView");
            resultsContainer.innerHTML = "";

            var i;
            for (i = 0; i < results.length; i++) {
                resultTemplate.render(results[i]).then(function (html) {
                    html.data = results[i];
                    html.addEventListener("click", setLocation);
                    resultsContainer.appendChild(html);
                });
            }
        });
    }

    function setLocation(e) {
        var data = e.srcElement.parentElement.data;
        var mapCenter = Finder.Home.map.getCenter();

        // get the lat/lon of the map
        mapCenter.latitude = data.lat;
        mapCenter.longitude = data.lon;
        Finder.Home.map.setView({ center: mapCenter });

        // move the push pin
        Finder.Home.locationPin.setLocation(new Microsoft.Maps.Location(data.lat, data.lon));

        // recalc distances of pins in list
        Finder.Data.recalcDistances();

        // set the current location
        Locations.currentLocation = mapCenter;

        // hide the flyout control
        var setting = document.getElementById("searching");
        $('#searchLocation').winControl().hide();
    }
})();
