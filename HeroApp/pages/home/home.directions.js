// Seperated the function as the main home.js was getting way to big
(function () {
    "use strict";

    WinJS.Namespace.define("Finder.Home", {
        // setup directions requested
        setupDirections: function (state) {
            

            // save the state 
            Locations.lastDirectionsstate = state;

            // clear the current route layer
            Finder.Home.routeLayer.clear();

            // set the bounding box
            var bbox = state.bbox;
            var viewBoundaries = Microsoft.Maps.LocationRect.fromLocations(new Microsoft.Maps.Location(bbox[0], bbox[1]), new Microsoft.Maps.Location(bbox[2], bbox[3]));
            Locations.lastDirectionsViewBoundries = viewBoundaries;

            // route the line
            var routeline = state.routePath.line;
            var routepoints = [];
            routeline.coordinates.forEach(function (item, index) {
                routepoints.push(new Microsoft.Maps.Location(item[0], item[1]));
            });
            var routeshape = new Microsoft.Maps.Polyline(routepoints,
                { strokeColor: new Microsoft.Maps.Color(200, 112, 111, 246), strokeThickness: 5 });
            Finder.Home.routeLayer.push(routeshape);

            // add the points on the route
            var itineraryItems = state.routeLegs[0].itineraryItems;
            var listItems = [];
            // add a route summary to top
            listItems.push({
                iconName: 'map-icon-route',
                header: 'Route',
                subHeader: '{0} {1}'.format(
                     RedBit.Settings.instance.unitOfMeasure === RedBit.Settings.UnitOfMeasureType.imperial ?
                    RedBit.Utilities.kmToMilesFriendly(state.travelDistance) : RedBit.Utilities.kmToFriendly(state.travelDistance),
                    RedBit.Utilities.secondsToFriendlyTime(state.travelDuration)),
                boundries: viewBoundaries,

            });
            itineraryItems.forEach(function (item, index) {
                // create the itinerary pin
                var pin = Finder.Home.createItineraryItemPin(item, index, itineraryItems);
                if (index === 0)
                    listItems[0].pin = pin;
                // create the route list item
                listItems.push(Finder.Home.createItinieraryListItem(item, index, itineraryItems, pin));


            });
            $('#directionsDetails').winControl().itemDataSource = new WinJS.Binding.List(listItems).dataSource;
            $('#directionsDetails').winControl().forceLayout();

            // hide the progress
            RedBit.WaitScreen.hideWait('Found the directions!', 400, true).done(function () {
                Finder.Home.crossFadeDirectionsStations(true).done(function () {
                    var directionsFlyout = $('#directionsFlyOut')[0];
                    if (directionsFlyout)
                        directionsFlyout.winControl.hide();

                    Finder.Home.directionsInProgress = false;
                });
            });
        },

        // create itinerary detail item
        createItinieraryListItem: function (item, index, array, pin) {
            var instruction = item.instruction;

            var ret = {
                iconName: '',
                header: '{0}. {1}'.format(index + 1, instruction.text),
                subHeader: '{0} {1}'.format(
                    RedBit.Settings.instance.unitOfMeasure === RedBit.Settings.UnitOfMeasureType.imperial ?
                    RedBit.Utilities.kmToMilesFriendly(item.travelDistance) : RedBit.Utilities.kmToFriendly(item.travelDistance),
                    RedBit.Utilities.secondsToFriendlyTime(item.travelDuration)),
                pin: pin
            }

            // set the icon type
            var type = instruction.maneuverType;
            switch (type) {
                case 'DepartStart':
                    ret.iconName = 'map-icon-start-point';
                    break;
                case 'ArriveFinish':
                    ret.iconName = 'map-icon-end-point';
                    if (item.hints && item.hints.length > 0) {
                        ret.subHeader = item.hints[0].text;
                    }
                    else {
                        ret.subHeader = '';
                    }
                    break;
                case 'BearLeft':
                    ret.iconName = 'map-icon-bear-left';
                    break;
                case 'BearRight':
                    ret.iconName = 'map-icon-bear-right';
                    break;
                case 'EnterRoundabout':
                case 'EnterThenExitRoundabout':
                case 'ExitRoundabout':
                    ret.iconName = 'map-icon-round-about';
                    break;
                case 'TakeRampLeft':
                case 'RampThenHighwayLeft':
                    ret.iconName = 'map-icon-exit-left';
                    break;
                case 'TakeRampRight':
                case 'RampThenHighwayRight':
                    ret.iconName = 'map-icon-exit-right';
                    break;
                case 'KeepLeft':
                    ret.iconName = 'map-icon-keep-left';
                    break;
                case 'KeepRight':
                    ret.iconName = 'map-icon-keep-right';
                    break;
                case 'KeepStraight':
                case 'KeepToStayStraight':
                case 'KeepOnRampStraight':
                case 'RampToHighwayStraight':
                case 'TakeRampStraight':
                    ret.iconName = 'map-icon-straight';
                    break;
                case 'TurnThenMerge':
                case 'BearThenMerge':
                case 'Merge':
                    ret.iconName = 'map-icon-merge';
                    break;
                case 'TurnLeft':
                    ret.iconName = 'map-icon-turn-left';
                    break;
                case 'TurnRight':
                    ret.iconName = 'map-icon-turn-right';
                    break;
                case 'UTurn':
                case 'TurnBack':
                    ret.iconName = 'map-icon-u-turn-left';
                    break;
                default:
                    ret.iconName = '';
            }

            return ret;

        },

        // create the route pin
        createItineraryItemPin: function (item, index, itineraryItems) {
            // set the options for the pin
            var loc = new Microsoft.Maps.Location(item.maneuverPoint.coordinates[0], item.maneuverPoint.coordinates[1]);
            var options = {
                text: '{0}'.format(index + 1),
                icon: '/images/pins/routePin.png',
                anchor: new Microsoft.Maps.Point(17, 17),
                textOffset: new Microsoft.Maps.Point(2, 7)
            };
            if (index === 0) {
                //options.id = 'routePinStart';
                options.text = 'A';
                options.icon = '/images/pins/routePinStart.png';
            }
            else if (index === itineraryItems.length - 1) {
                // options.id = 'routePinEnd';
                options.text = 'B';
                options.icon = '/images/pins/routePinEnd.png';
            }
            else {
                //options.id = 'routePin';
            }
            // Create the pin and add
            var pin = new Microsoft.Maps.Pushpin(loc, options);
            Finder.Home.routeLayer.push(pin);

            // return the pin
            return pin;
        },

        // animates the directions in
        crossFadeDirectionsStations: function (directionsIn) {
            // setup the sharing
            if (directionsIn) {
                Finder.Home.setupListSharing(false);
                Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView().addEventListener('datarequested', Finder.Home.shareRequestHandler);
            }
            else {
                Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView().removeEventListener('datarequested', Finder.Home.shareRequestHandler);
                Finder.Home.setupListSharing(true);
            }

            return new WinJS.Promise(function (c, e, p) {
                // get the items so winjs doesn't crap out if one elem in an array is null
                var items = [];
                var elem = Finder.Home.poiLayerElement();
                if (elem) items.push(elem);
                elem = Finder.Home.infoBoxLayerElement();
                if (elem) items.push(elem);

                if (directionsIn) {
                    // setup the directions list and show
                    WinJS.UI.Animation.crossFade(Finder.Home.routeLayerElement(), items).done(function () {
                        Finder.Home.showDirectionsList(true).done(function () {
                            WinJS.Promise.timeout(250).done(function () {
                                Finder.Home.map.setView({ bounds: Locations.lastDirectionsViewBoundries });
                                Finder.Home.hideAllAppBars();
                                cmdDirections.winControl.hidden = false;
                                c();
                            });
                        });
                    });
                }
                else {
                    WinJS.UI.Animation.crossFade(items, Finder.Home.routeLayerElement()).done(function () {
                        Finder.Home.showDirectionsList(false).done(function () {
                            WinJS.Promise.timeout(250).done(function () {
                                Finder.Home.hideAllAppBars();
                                c();
                            });
                        });
                    });
                }
            });
        },

        // shows or hides the directions list
        showDirectionsList: function (show) {
            return new WinJS.Promise(function (c) {
                if (show) {
                    if ($('.directionsDiv').css('visibility') === 'hidden') {
                        $('.directionsDiv').css('visibility', 'visible')
                                               .css('opacity', '1')
                                               .css('height', screen.height);
                        WinJS.UI.Animation.showPanel($('.directionsDiv')[0]).done(function () {
                            // set the width of the map
                            $('#mapdiv').css('width', '{0}px'.format(screen.width - parseInt($('.directionsDiv').css('width'))));
                            $('#mapdiv').css('float', 'left');
                            if (c)
                                c();
                        });
                    }
                    else {
                        c();
                    }
                }
                else {
                    if ($('.directionsDiv').css('visibility') === 'visible') {
                        // set the width of the map
                        $('#mapdiv').css('width', '');
                        $('#mapdiv').css('float', '');
                        WinJS.UI.Animation.hidePanel($('.directionsDiv')[0]).done(function () {;
                            $('.directionsDiv').css('visibility', 'hidden')
                                               .css('opacity', '0');
                            if (c)
                                c();
                        });
                    }
                    else {
                        c();
                    }
                }
            });
        },

        // determins if directions are visible or not
        directionsVisible: {
            get: function () {
                return $('.directionsDiv').css('visibility') === 'visible';
            }
        },

        // get route directions from bing maps
        getDirections: function (startPosition, endPosition) {

            var that = this;
            return new WinJS.Promise(function (complete, error, progress) {

                var startPos = '{0},{1}'.format(startPosition.latitude, startPosition.longitude);
                var endPos = '{0},{1}'.format(endPosition._location.latitude, endPosition._location.longitude);

                // set the url to get rout details
                var url = Finder.Config.routeUrl.format(
                    startPos,
                    endPos,
                    Finder.Config.bingMapsKey);

                // make the request
                WinJS.xhr({
                    url: url,
                    headers: {
                        'Cache-Control': 'no-cache',
                        'If-Modified-Since': 'Mon, 27 Mar 1972 00:00:00 GMT',
                        'Content-type': 'application/json'
                    },
                }).done(function (result) {
                    var res = JSON.parse(result.responseText);
                    var t = res;
                    var status = {};
                    try {
                        if (res.statusCode === 200) {
                            // quick quality check
                            if (res.resourceSets.length > 0 && res.resourceSets[0].resources.length > 0) {
                                status = { status: 'ok', state: res.resourceSets[0].resources[0] };
                                complete(status);

                            }
                            else {
                                status = { status: 'error', msg: 'no results returned' };
                                error(status);
                            }
                        }
                        else {
                            status = { status: 'error', msg: 'invalid status code (code: {0})'.format(result.statusCode) };
                            error(status);
                        }
                    }
                    finally {
                        // no-op
                    }
                },
                function (result) {
                    var res = JSON.parse(result.responseText);
                    error({ status: 'error', msg: '{0} (code: {1})'.format(res.errorDetails[0], res.statusCode )});
                });
            });
        },

        // share handler for sharing directions
        shareRequestHandler: function (e) {

            // setup the sharing
            var request = e.request;
            var isMetric = RedBit.Settings.instance.unitOfMeasure === RedBit.Settings.UnitOfMeasureType.metric;
            var poi = Locations.selectedPoi;
            request.data.properties.title = 'Directions to {0}'.format(poi[Finder.Config.nameField]);

            // calcluate distance
            var distance = Locations.lastDirectionsstate.travelDistance;


            var desc = '{0} away.'.format(
                isMetric ? RedBit.Utilities.kmToFriendly(distance) : RedBit.Utilities.kmToMilesFriendly(distance));

            var url = 'http://www.bing.com/maps/default.aspx?v=2&rtp=pos.{0}_{1}_My%20Location~pos.{2}_{3}_{4}'.format(
                Locations.currentLocation.latitude,
                Locations.currentLocation.longitude,
                poi._location.latitude,
                poi._location.longitude,
                poi.brand
                );
            var text = 'Directions to <a href="{0}">{1}</a><br/><br/>{2}'.format(url, poi[Finder.Config.nameField], desc);

            request.data.properties.description = desc;
            request.data.setHtmlFormat(Windows.ApplicationModel.DataTransfer.HtmlFormatHelper.createHtmlFormat(text));
        },
    });

})();