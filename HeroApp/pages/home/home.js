(function () {
    "use strict";
    
    WinJS.UI.Pages.define("/pages/home/home.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {

            // start getting the settings
            Finder.Data.getSettings().done(function (settings) {
                console.log('settings got : ' + JSON.stringify(settings));
            },
            function (e,t) {
                // no-op just ignore error
            });

            WinJS.Binding.processAll();
            
            // wire up the search location flyout
            $("#cmdSearchLocation").addEventListener("click", locationFlyout, false);

            // init the new comment and issue stuff
            Finder.Home.initializeCommentsIssues();

            // setup login listeners
            cmdLogin.addEventListener("click", function (e) {
                if (cmdLogin.winControl._label === "Login") {
                    Hero.Auth.login(function () {
                        cmdLogin.winControl.label = "Logout";
                    });
                }
                else {
                    Hero.Auth.logout();
                    cmdLogin.winControl.label = "Login";
                }
            }, null);
            if (Hero.Auth.isLoggedIn)
                cmdLogin.winControl.label = "Logout";
            else
                cmdLogin.winControl.label = "Login";

            // wire up the back button for directions
            $('.directionsDiv .title-header .win-backbutton')[0].addEventListener('click', function (e) {
                Finder.Home.crossFadeDirectionsStations(false);
            });
            Finder.Home.showDirectionsList(false);


            var that = this;
            // wire up list click
            $('.directionsDetails')[0].addEventListener('iteminvoked', function (eventInfo) {
                if (Windows.UI.ViewManagement.ApplicationView.value === Windows.UI.ViewManagement.ApplicationViewState.snapped)
                    Windows.UI.ViewManagement.ApplicationView.tryUnsnap();

                var ctl = $('.directionsDetails').winControl();
                var index = eventInfo.detail.itemIndex;
                var item = ctl.itemDataSource.list.getItem(index).data;

                if (index === 0) {
                    // if its the first item it will have a boundries of the entire route
                    Finder.Home.map.setView({ bounds: item.boundries });
                }
                else {
                    // if it's not the first item then  map the item, prev and next
                    var prevItem = undefined;
                    if (index > 0)
                        prevItem = ctl.itemDataSource.list.getItem(index - 1).data;
                    var nextItem = undefined;
                    if (index + 1 < ctl.itemDataSource.list.length)
                        nextItem = ctl.itemDataSource.list.getItem(index + 1).data;
                    var bounds = [];
                    if (prevItem)
                        bounds.push(new Microsoft.Maps.Location(prevItem.pin._location.latitude, prevItem.pin._location.longitude));
                    bounds.push(new Microsoft.Maps.Location(item.pin._location.latitude, item.pin._location.longitude));
                    if (nextItem)
                        bounds.push(new Microsoft.Maps.Location(nextItem.pin._location.latitude, nextItem.pin._location.longitude));
                    var viewBoundaries = Microsoft.Maps.LocationRect.fromLocations(bounds);
                    Finder.Home.map.setView({ bounds: viewBoundaries });
                }
            });

            // init map
            initializeMap().done(function () {
                // Map initialized, zoom in on the US
                var options = Finder.Home.map.getOptions();
                options.zoom = 4;
                options.center = new Microsoft.Maps.Location(56.130366, -106.346771);
                options.animate = true;
                Finder.Home.map.setView(options);

                // get the current location
                if (!Locations.currentLocation) {
                    // we already got the location
                    getCurrentLocation(true);
                }
                else {
                    // just load the pin data
                    updateFromNewPosition(Locations.currentLocation, true);
                }
            }, function () {
                // there was an error initializing the map
            });

            // wire up buttons
            cmdLocation.addEventListener('click', function () {
                getCurrentLocation(false);
                Finder.Home.hideAllAppBars();
            });

            cmdRefreshList.addEventListener('click', function () {
                Finder.Home.hideAllAppBars();

                Finder.Home.crossFadeDirectionsStations(false).done(function () {
                    Finder.Home.infoBox.setOptions({ visible: false });
                    if (Locations.currentLocation)
                        getData()
                    else
                        getCurrentLocation(true);
                });
            });

            cmdDirections.winControl.hidden = true;
            cmdDirections.addEventListener('click', function () {
                if (Locations.lastDirectionsstate)
                    Finder.Home.crossFadeDirectionsStations(true);
            });

            cmdMyIssues.addEventListener('click', toggleMyIssuesFilter);
            $('#sortName').addEventListener('click', function () { sortLocations("name") });
            $('#sortDescription').addEventListener('click', function () { sortLocations("description") });
            $('#sortDistance').addEventListener('click', function () { sortLocations("distance") });

            var cats = Finder.Config.categories.split(',');
            var catHtml = "";
            for (var i in cats) {
                var cat = cats[i];
                catHtml += "<option value='" + cat + "'>" + cat + "</option>";
            }
            $('#categorySelect')[0].innerHTML = catHtml;

            Finder.Home.setupListSharing(true);

        },

        unload: function (e) {
            Finder.Home.map = null;
        },

        updateLayout: function (element, viewState, lastViewState) {
            var myViewState = Windows.UI.ViewManagement.ApplicationView.value;
            switch (myViewState) {
                case Windows.UI.ViewManagement.ApplicationViewState.snapped:
                    // hide the info box
                    Finder.Home.infoBox.setOptions({ visible: false });

                    // resize the details image
                    if (Finder.Home.detailsVisible)
                        Finder.Home.createMap(Locations.selectedPoi);
                    break;
                case Windows.UI.ViewManagement.ApplicationViewState.filled:
                    if (Finder.Home.detailsVisible)
                        Finder.Home.createMap(Locations.selectedPoi);
                    break;
                case Windows.UI.ViewManagement.ApplicationViewState.fullScreenLandscape:
                    if (Finder.Home.detailsVisible)
                        Finder.Home.createMap(Locations.selectedPoi);
                    break;
                case Windows.UI.ViewManagement.ApplicationViewState.fullScreenPortrait:
                    if (Finder.Home.detailsVisible)
                        Finder.Home.createMap(Locations.selectedPoi);
                    break;
                default:
                    break;
            }
        },

        visibleIfNotNull : WinJS.Binding.converter(function (val) {
            return val ? "block" : "none";
        })


    });

    function listShareDataRequested(e) {
        var deferral = e.request.getDeferral();

        var msg = "";

        for (var loc in Locations.locations) {
            msg += Finder.Formatter.format(Finder.Config.shareListText, Locations.locations[loc]) +"\n";
        }

        e.request.data.properties.title = Finder.Config.shareTitle;
        e.request.data.properties.description = Finder.Config.shareListDescription;
        e.request.data.setText(msg);
        deferral.complete();
    }

    function sortLocations(field) {
        displayData(Locations.locations.sort(Finder.Data.dynamicSort(field)));
    }

    function toggleMyIssuesFilter() {
        if (Hero.Auth.isLoggedIn) {
            if (cmdMyIssues.winControl.label === "My Issues") {
                Locations.locations = [];
                for (var i = 0; i < Locations.unfilteredLocations.length; i++) {
                    var loc = Locations.unfilteredLocations[i];
                    if (loc.email == Hero.Auth.currentUser.email) {
                        Locations.locations.push(loc);
                    }
                }
                cmdMyIssues.winControl.label = "All Issues"
            }
            else {
                Locations.locations = Locations.unfilteredLocations;
                cmdMyIssues.winControl.label = "My Issues"
            }
            
            displayData(Locations.locations);

        }
        else {
            RedBit.Utilities.showMessage("You have to log in to filter by your Issues");
        }
    }

    //show the search location flyout
    function locationFlyout() {
        
        Finder.Home.crossFadeDirectionsStations(false).done(function () {
            Finder.Home.hideAllAppBars();
            WinJS.UI.SettingsFlyout.showSettings('searchLocation', '/pages/searchLocation/searchLocation.html');
        });
    }
   
    // get the point of interest data
    function getData() {
        RedBit.WaitScreen.showWait("Retreiving data ...", true).done(function () {;
            Finder.Data.getData().done(function (locations) {
                if(locations) displayData(locations);
                //make sure we also refresh the current poi
                if( Locations.selectedPoi ) {
                    for (var i = 0; i < locations.length; i++) {
                        if (locations[i]._id === Locations.selectedPoi._id) {
                            Locations.selectedPoi = locations[i];
                        }
                    }

                    Finder.Home.initializeDetailsView();
                }
                RedBit.WaitScreen.hideWait("Data retrieved!", 100, true);

                // set the view to the pins so they are all in view
                setTimeout(function () {
                    Finder.Home.map.setView({ bounds: Microsoft.Maps.LocationRect.fromLocations(Finder.Home.initialBounds) });
                }, 250);

                Microsoft.Maps.Events.addThrottledHandler(Finder.Home.map, 'viewchangeend', updateListForMap, 250);
            });
        });
    }

    // display the point of interest data
    function displayData(locations) {
        if (locations.length > 0) {
            // display the stations
            RedBit.WaitScreen.hideWait(Finder.Config.poiDataAvailable.format(locations.length), 500, true);

            // clear poi data
            Finder.Home.poiLayer.clear();

            // bounds to setup the map to focus on
            var bounds = [];

            // add the user's location to the bounds
            if (Finder.Config.includeUserLocationOnPoiDisplayed) {
                bounds.push(new Microsoft.Maps.Location(
                    Locations.currentLocation.latitude,
                    Locations.currentLocation.longitude));
            }

            // loop all returned items and add to map
            locations.forEach(function (location) {
                var loc = new Microsoft.Maps.Location(location[Finder.Config.latitudeField], location[Finder.Config.longidudeField]);
                bounds.push(createPoiPin(location));
            });

            // save the bounds
            Finder.Home.initialBounds = bounds;

            //TODO: Remove this hack
            listHack();

            

        }
        else {
            // no stations found
            RedBit.WaitScreen.hideWait(Finder.Config.noPoiData, 500, true).done(function () {
                try{
                    new Windows.UI.Popups.MessageDialog(Finder.Config.noPoiDataMessage, Finder.Config.noPoiDataMessageTitle).showAsync();
                }
                catch (ex) {
                    // sometime get access denied for some reason just no-op
                }
            });
        }
        // enable the buttons
        enableButtons(true);

    }

    // create the pin for the station
    // returns a location object
    function createPoiPin(data) {
        // create the location obj
        var loc = new Microsoft.Maps.Location(
            data[Finder.Config.latitudeField],
            data[Finder.Config.longidudeField]);

        // create a new pin
        var pin = new Microsoft.Maps.Pushpin(loc);

        // add the poi to the pin for future reference
        pin._poiData = data;
        pin._poiData._location = loc;

        // add to the poi layer
        Finder.Home.poiLayer.push(pin);

        // add click handler for the pin   
        Microsoft.Maps.Events.addHandler(pin, 'click', function (e) {
            if (!Finder.Home.directionsVisible && !Finder.Home.newIssueVisible) {
                // get the bounds box
                var bounds = [];

                // add the pin data
                bounds.push(pin._poiData._location);

                // add the current location
                if (Finder.Config.includeUserLocationOnPoiSelected) {
                    bounds.push(new Microsoft.Maps.Location(
                        Locations.currentLocation.latitude,
                        Locations.currentLocation.longitude));
                }

                // set the view for the map
                Finder.Home.map.setView({
                    bounds: Microsoft.Maps.LocationRect.fromLocations(bounds)
                });

                // now show the infobox
                Locations.selectedPoi = pin._poiData;
                Finder.Home.infoBox.setLocation(e.target.getLocation());
                Finder.Home.infoBox.setOptions({ visible: true, title: pin._poiData[Finder.Config.nameField], description: '<img src="{0}">'.format(pin._poiData[Finder.Config.imageField]) });
            }
        });

        // return the location object
        return loc;
    }

    // initializes the map
    function initializeMap() {
        return new WinJS.Promise(function (c, e, p) {
            Microsoft.Maps.loadModule('Microsoft.Maps.Themes.BingTheme', {
                callback: function () {
                    Microsoft.Maps.loadModule('Microsoft.Maps.Map', {
                        // callback method when module loads
                        callback: function () {

                            var mapElem = document.querySelector('#mapdiv');
                            Finder.Home.map = new Microsoft.Maps.Map(mapElem,
                                {
                                    credentials: Finder.Config.bingMapsKey,
                                    showBreadcrumb: false,
                                    showDashboard: true,
                                    showMapTypeSelector: false,
                                    theme: new Microsoft.Maps.Themes.BingTheme(),
                                    mapTypeId: Microsoft.Maps.MapTypeId.road,
                                });

                            // setup the gps layer
                            Finder.Home.gpsLayer = new Microsoft.Maps.EntityCollection();
                            Finder.Home.map.entities.push(Finder.Home.gpsLayer);

                            // init the station layers
                            Finder.Home.poiLayer = new Microsoft.Maps.EntityCollection();
                            Finder.Home.map.entities.push(Finder.Home.poiLayer);

                            // init the infobox layer
                            Finder.Home.infoBoxLayer = new Microsoft.Maps.EntityCollection();
                            Finder.Home.map.entities.push(Finder.Home.infoBoxLayer);

                            // create the info box used for all pins
                            Finder.Home.infoBox = new Microsoft.Maps.Infobox(new Microsoft.Maps.Location(0, 0),
                            {
                                title: 'unknown',
                                pin: undefined,
                                description: '',
                                visible: false,
                                actions: [
                                    {
                                        label: '<input type="button" value="Directions"/>', eventHandler: function (e) {
                                            RedBit.WaitScreen.showWait('Finding directions ...', true)
                                            // call the get directions
                                            Finder.Home.getDirections(Locations.currentLocation, Locations.selectedPoi).done(function (resp) {
                                                if (resp.status === 'ok') {
                                                    // we are good so show the directions
                                                    Finder.Home.setupDirections(resp.state);
                                                }
                                                else {
                                                    // there was an error so just display to user
                                                    RedBit.WaitScreen.hideWait('Can\'t find directions :(', 400, true)
                                                    RedBit.Utilities.showMessage('We were unable to find directions. Please try again. Error Message: {0}'.format(resp.msg), 'No Directions');
                                                }
                                            },
                                            function (error) {
                                                RedBit.WaitScreen.showWait('Can\'t find directions :(', true)
                                                RedBit.Utilities.showMessage('We were unable to find directions. Please try again. Error Message: {0}'.format(error.msg), 'No Directions').done(function () {
                                                    RedBit.WaitScreen.hideWait('Can\'t find directions :(', 100, true)
                                                });
                                            });
                                        }
                                    },
                                    {
                                        label: '<input type="button" value="Details"/>', eventHandler: function (e) {
                                            Finder.Home.infoBox.setOptions({ visible: false });
                                            Finder.Home.showDetailsView('#main', function (done) {
                                                if (done) {
                                                    Finder.Home.infoBox.setOptions({ visible: true });
                                                }
                                            });
                                        }
                                    }
                                ],
                            });
                            Finder.Home.infoBoxLayer.push(Finder.Home.infoBox);

                            // setup the route layer
                            Finder.Home.routeLayer = new Microsoft.Maps.EntityCollection();
                            Finder.Home.map.entities.push(Finder.Home.routeLayer);

                            // callback
                            c();
                        }
                    });
                }
            });
        });
    }
    function updateListForMap(e) {
        if (!Finder.Home.directionsVisible && !Finder.Home.newIssueVisible) {
            var _mapBounds = Finder.Home.map.getBounds();
            Locations.locations = [];
            for (var i in Locations.unfilteredLocations) {
                var pos = Locations.unfilteredLocations[i];

                if (_mapBounds.contains(new Microsoft.Maps.Location(pos.latitude, pos.longitude))) {
                    Locations.locations.push(pos);
                }
            }

            displayData(Locations.locations);
        }
    }

    // gets the current location
    function getCurrentLocation(autoLoadPins) {
        // get the current location
        RedBit.WaitScreen.showWait("Please wait while we find your location...",true);
        enableButtons(false);

        // this is used to show the accuracy circle
        Finder.Home.geoLocationProvider = new Microsoft.Maps.GeoLocationProvider(Finder.Home.map);

        
        var loc = new RedBit.Location();

        loc.addEventListener(RedBit.Location.geoLocationCompleteEvent, function (pos) {
            // set the lastLocation
            Locations.currentLocation = pos.detail;

            // update the ui
            updateFromNewPosition(pos.detail, autoLoadPins);

        }, false);

        loc.addEventListener(RedBit.Location.geoLocationErrorEvent, function (error) {
            // there was an error so callback the error handler
            RedBit.WaitScreen.hideWait('Unable to get your location :(', 1000, true);
            new Windows.UI.Popups.MessageDialog(error.detail, 'Unable to find your location.').showAsync();
            enableButtons(true);
        }, false);

        loc.getLocation();

        
            
    }

    // method to update the UI once a position is found
    function updateFromNewPosition(pos, autoLoadPins) {

        if (!autoLoadPins) {
            enableButtons(true);
            RedBit.WaitScreen.hideWait('Found your location!', 1000, true);
        }
        else
            RedBit.WaitScreen.setProgressText('Found your location!', true);

        // set the view on the users current location
        Finder.Home.map.setView({
            center: new Microsoft.Maps.Location(pos.latitude, pos.longitude),
        });

        // set the pushpin
        //if (!Finder.Home.locationPin) {
        Finder.Home.gpsLayer.clear();
            Finder.Home.locationPin = new Microsoft.Maps.Pushpin(
                new Microsoft.Maps.Location(pos.latitude, pos.longitude),
                { icon: "/images/pins/mylocation.png" });

            Microsoft.Maps.Events.addHandler(Finder.Home.locationPin, 'click', function (e) {
                // set the view for the map
                Finder.Home.map.setView({
                    center: new Microsoft.Maps.Location(pos.latitude, pos.longitude)
                });
            });

            Finder.Home.gpsLayer.push(Finder.Home.locationPin);
       

        // set the circle to show the location
        try{
            Finder.Home.geoLocationProvider.getCurrentPosition({
                updateMapView: true,
                successCallback: function (e) {
                    // NOOP - just so we can have the circle placed on the map
                }
            });
        }
        catch (ex) {
            // noop 
        }

        if (autoLoadPins) {
            // make a call to get all the stations
            getData()
        }
    }

    // disable buttons
    function enableButtons(enable) {
        cmdLocation.winControl.disabled = !enable;
        cmdRefreshList.winControl.disabled = !enable;
        cmdDirections.winControl.disabled = !enable;
    }

    // just deterimines if we are in snap mode or not
    function isSnapMode() {
        var myViewState = Windows.UI.ViewManagement.ApplicationView.value;
        return myViewState === Windows.UI.ViewManagement.ApplicationViewState.snapped;
    }

    //hack to get the list showing 
    //TODO: remove this
    function listHack() {
        var productTemplate = new WinJS.Binding.Template($("#rowTemplate")[0]);
        var productContainer = $("#listList")[0];
        productContainer.innerHTML = "";

        var locs = Locations.locations;
        var i, loc;
        for (i = 0; i < locs.length; i++) {
            loc = locs[i];
            //Add in the name field
            loc.commentLength = loc.comments.length;
            loc.name = loc[Finder.Config.nameField];
            loc.secondary = loc[Finder.Config.secondaryField];
            loc.img_url = loc[Finder.Config.imageField];
            if (RedBit.Settings.instance.unitOfMeasure === RedBit.Settings.UnitOfMeasureType.metric)
                loc.distanceFriendly = RedBit.Utilities.kmToMilesFriendly(parseInt(loc.distance)) + ' away';
            else
                loc.distanceFriendly = RedBit.Utilities.kmToFriendly(parseInt(loc.distance)) + ' away';

            productTemplate.render(loc).then(function (result) {
                result.data = loc;
                result.addEventListener("click", rowClick);
                productContainer.appendChild(result);
            });
        }
    }
    function rowClick(e) {
        //e.target.attributes["data-id"].value;
        Locations.selectedPoi = e.currentTarget.data;
        if (isSnapMode()) {
            Finder.Home.infoBox.setOptions({ visible: false });
            Finder.Home.showDetailsView('#main');
        }
        else {
            Finder.Home.map.setView({
                bounds: Microsoft.Maps.LocationRect.fromLocations([Locations.selectedPoi._location])
            });
            Finder.Home.infoBox.setLocation(Locations.selectedPoi._location);
            Finder.Home.infoBox.setOptions({ visible: true, title: Locations.selectedPoi.title, description: '<img src="{0}">'.format(Locations.selectedPoi.img_url) });
            Finder.Home.infoBox.setOptions({ visible: true });
            console.log("some stuffs");
        }
    }

    function hideAllAppBars() {
        appBar.winControl.hide();
        appBarUpper.winControl.hide();
        detailsAppBar.winControl.hide();
        detailsAppBar.disabled = true;
    }

    WinJS.Namespace.define('Finder.Home',
        {
            getData: getData,
            getCurrentLocation: getCurrentLocation,
            hideAllAppBars: hideAllAppBars,

            // wires up the details sharing
            setupListSharing: function (enable) {
                // setup sharing for details
                var dtm = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
                if (enable) {
                    Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView().addEventListener('datarequested', listShareDataRequested);
                }
                else {
                    Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView().removeEventListener('datarequested', listShareDataRequested);
                }
            },
        });
})();
