(function () {
    "use strict";

    WinJS.Namespace.define("RedBit", {
        // various utilities
        Utilities: WinJS.Class.define(
            function Utilities() {
            },
            // members
            {},
            // statics
            {
                // converts km to miles
                kmToMiles: function (value) {
                    var ret = value * 0.621371;
                    return parseFloat(ret).toFixed(2);
                },

                // converts km to miles with a friendly string
                kmToMilesFriendly: function (value) {

                    var val = RedBit.Utilities.kmToMiles(value);
                    if(val > 1)
                        return '{0} miles'.format(val);
                    else
                        return '{0} mile'.format(val);
                },

                kmToFriendly: function (value) {
                    if(value > 1)
                        return '{0} kms'.format(value.toFixed(2));
                    else
                        return '{0} km'.format(value.toFixed(2));
                },

                // seconds sto minutes
                secondsToMinutes: function (value) {
                    return value / 60;
                },

                // converts to a friendly time
                secondsToFriendlyTime: function (value) {
                    var mins = value / 60; // convert to minutes
                    if (mins > 60) {
                        // convert to hours
                        var hrs = mins / 60;
                        var mins = mins % 60;
                        if (val > 24) {
                            // convert to days, hours, minutes
                            var val = hrs;
                            var days = hrs / 24;
                            hrs = hrs % 24;
                            mins = hrs % 60;
                            return '{0} day{1} {2} hrs{3} {4} min{5}'.format(
                                days.toFixed(0),
                                days > 1 ? 's':'',
                                hrs.toFixed(0),
                                hrs > 1 ? 's': '',
                                mins.toFixed(0),
                                mins > 1 ? 's': '');
                        }
                        else {
                            return '{0} hrs {1} mins'.format(hrs.toFixed(0), mins.toFixed(0));
                        }
                    }
                    else {
                        return '{0} mins'.format(mins.toFixed(0));
                    }
                },

                /*
                 * JavaScript Pretty Date
                 * Copyright (c) 2011 John Resig (ejohn.org)
                 * Licensed under the MIT and GPL licenses.
                 * http://ejohn.org/files/pretty.js
                 */

                // Takes an ISO time and returns a string representing how long ago the date represents.
                prettyDate: function (time) {
                    if (!time)
                        return 'Unknown';
                    //                    var date = new Date((time || "").replace(/-/g, "/").replace(/[TZ]/g, " ")),
                    var date = new Date(time),
                        diff = (((new Date()).getTime() - date.getTime()) / 1000),
                        day_diff = Math.floor(diff / 86400);

                    if (isNaN(day_diff) || day_diff < 0 || day_diff >= 31)
                        return 'Unknown';

                    return day_diff == 0 && (
                            diff < 60 && "just now" ||
                            diff < 120 && "1 minute ago" ||
                            diff < 3600 && Math.floor(diff / 60) + " minutes ago" ||
                            diff < 7200 && "1 hour ago" ||
                            diff < 86400 && Math.floor(diff / 3600) + " hours ago") ||
                        day_diff == 1 && "Yesterday" ||
                        day_diff < 7 && day_diff + " days ago" ||
                        day_diff < 31 && Math.ceil(day_diff / 7) + " weeks ago";
                },

                // gets the app version
                appVersion: function () {
                    var p = Windows.ApplicationModel.Package.current.id.version;
                    return p.major + "." + p.minor + "." + p.build + "." + p.revision;
                },

                // gets a friendly name of version
                appVersionFriendly: function (short) {
                    if (short)
                        return 'v{0}'.format(RedBit.Utilities.appVersion());
                    else
                        return 'Version {0}'.format(RedBit.Utilities.appVersion());
                },

                // shows a simple messagebox
                showMessage: function (message, title) {
                    if (title)
                        return (new Windows.UI.Popups.MessageDialog(message, title)).showAsync();
                    else
                        return (new Windows.UI.Popups.MessageDialog(message)).showAsync();
                }
            }
        ),

        // app bar helper
        AppBar: WinJS.Class.define(
            // ctor
            function AppBar(){
            },
            // members
            {
                
            },
            // statics
            {
                removeAppBars: function () {
                    // Remove app bar from previous scenario
                    var otherAppBars = document.querySelectorAll('div[data-win-control="WinJS.UI.AppBar"]');
                    for (var i = 0; i < otherAppBars.length; i++) {
                        otherAppBars[i].parentNode.removeChild(otherAppBars[i]);
                    }
                },

                disableAppBars: function () {
                    var otherAppBars = document.querySelectorAll('div[data-win-control="WinJS.UI.AppBar"]');
                    for (var i = 0; i < otherAppBars.length; i++) {
                        otherAppBars[i].winControl.disabled = true;
                    }
                },

                enableAppBars: function () {
                    var otherAppBars = document.querySelectorAll('div[data-win-control="WinJS.UI.AppBar"]');
                    for (var i = 0; i < otherAppBars.length; i++) {
                        otherAppBars[i].winControl.disabled = false;
                    }
                }
            }),

        WaitScreen: WinJS.Class.define(
            // simple wait screen add the the following JS and CSS to default.js
            /*
            <!-- UI TO SHOW PROGRESS -->
                <div id="progressDisplay">
                    <div class="transparent"></div>
                    <div class="progressContent">
                        <p class="win-type-x-large">Signing in</p>
                        <progress class="win-large"></progress>
                    </div>
                </div>

            // main styles for app bar to show title and back button

            #progressDisplay
                    {
                    position: absolute;
                left: 0px;
                top: 0px;
                width: 100%;
                height: 100%;
                color: white;
                background-color: transparent;
                z-index: 1001;
                visibility:collapse;
            }

                #progressDisplay .transparent {
            position: absolute;
            left: 0px;
            top: 0px;
            width: 100%;
            height: 100%;
            opacity:.5;
            background-color:#323232;
            }

                #progressDisplay .progressContent {
                position: absolute;
                left: 0px;
                top: calc(50% - (250px/2));
                width: 100%;
                height: auto;
                    min-height:250px;
                    opacity:1;
                    background-color:#323232;
                }

                #progressDisplay p,
                #progressDisplay progress {
                    opacity: 1;
                    position: absolute;
                    top: calc(50% - (80pt/2));
                    width: 100%;
                    text-align: center;
                    color: white !important;
                }

                #progressDisplay progress {
                    left: 0;
                    top: 55%;
                }
	
	            @media screen and (-ms-view-state: snapped) {
		            #progressDisplay progress {
			            left: 0;
			            top: 43%;
		            }
	            }
            */

            function WaitScreen() {
            },
            // members
            {
            },
            // statics
            {
                showWait: function (text, useEdge) {
                    if (!useEdge)
                        RedBit.AppBar.disableAppBars();

                    return new WinJS.Promise(function (c, e, p) {
                        if (!useEdge) {
                            var elem = document.querySelector('#progressDisplay');
                            if (!elem) {
                                if (e)
                                    e('#progressDisplay element not found');
                                return;
                            }

                            // set the text
                            var textDisplay = document.querySelector('#progressDisplay .progressContent p');
                            if (!textDisplay) {
                                if (e)
                                    e('cannot find text element to set text');
                                return;
                            }
                            textDisplay.textContent = text;

                            // show the edge ui
                            //WinJS.Utilities.addClass(elem, 'opacity');
                            elem.style.opacity = '1';

                            //WinJS.Utilities.addClass(elem, 'visibility');
                            elem.style.visibility = 'visible';

                            WinJS.UI.Animation.fadeIn(elem[0]).then(function () {
                                c();
                            });
                        }
                        else {
                            // show progress using edge
                            var elem = document.querySelector('.progressDisplayEdge');
                            if (!elem) {
                                if (e)
                                    e('.progressDisplayEdge element not found');
                                return;
                            }

                            // set the text
                            var textDisplay = document.querySelector('.progressDisplayEdge p');
                            if (!textDisplay) {
                                if (e)
                                    e('cannot find text element to set text');
                                return;
                            }
                            textDisplay.textContent = text;

                            // show the edge ui
                            //WinJS.Utilities.addClass(elem, 'opacity');
                            if (elem.style.opacity != '1') {
                                elem.style.opacity = '1';

                                //WinJS.Utilities.addClass(elem, 'visibility');
                                elem.style.visibility = 'visible';

                                WinJS.UI.Animation.showEdgeUI(elem[0]).then(function () {
                                    c();
                                });
                            }
                            else {
                                c();
                            }
                        }
                    });
                },

                hideWait: function (text, delay, useEdge) {
                    return new WinJS.Promise(function (c, e, p) {
                        function hide() {
                            if (useEdge) {
                                var elem = document.querySelector('.progressDisplayEdge');
                                if (!elem) {
                                    if (e)
                                        e('.progressDisplayEdge element not found');
                                    return;
                                }

                                WinJS.UI.Animation.hideEdgeUI(elem[0]).done(function () {
                                    elem.style.opacity = '0';
                                    elem.style.visibility = 'hidden';

                                    // callback
                                    c();
                                });
                            }
                            else {
                                RedBit.AppBar.enableAppBars();
                                var elem = document.querySelector('#progressDisplay');
                                if (!elem) {
                                    if (e)
                                        e('#progressDisplay element not found');
                                    return;
                                }

                                WinJS.UI.Animation.fadeOut(elem[0]).done(function () {
                                    elem.style.opacity = '0';
                                    elem.style.visibility = 'hidden';

                                    // callback
                                    c();
                                });
                            }
                        }

                        if (delay && text) {
                            // update the text
                            RedBit.WaitScreen.setProgressText(text);
                            WinJS.Promise.timeout(delay).done(function () {
                                hide();
                            });
                        }
                        else {
                            hide();
                        }

                    });
                },

                setProgressText: function (text, useEdge) {
                    if (useEdge) {
                        var textDisplay = document.querySelector('.progressDisplayEdge p');
                        if (textDisplay) {
                            textDisplay.textContent = text;
                        }
                    }
                    else {
                        var textDisplay = document.querySelector('#progressDisplay .progressContent p');
                        if (textDisplay) {
                            textDisplay.textContent = text;
                        }
                    }
                },
            }),

        Location: WinJS.Class.define(
            // class that just encapsulates some common location code
            function Location() {
                this._self = this;
            },

            // members
            {
                _self: null,

                // holds a ref to the geo location
                _geolocator: null,

                // get the location
                getLocation: function () {
                    var that = this._self;
                    return new WinJS.Promise(function (c, e, p) {
                        // notify that we started
                        that.dispatchEvent(RedBit.Location.geoLocationStartedEvent);

                        //start to get location and respond appropriately
                        navigator.geolocation.getCurrentPosition(function (pos) {
                            var result = pos.coords;
                            that.dispatchEvent(RedBit.Location.geoLocationCompleteEvent, result);
                        },
                        function (error) {
                            that.dispatchEvent(RedBit.Location.geoLocationErrorEvent,
                                that._getStatusString(error));
                        });
                    });
                },

                // helper method to get location status
                _getStatusString: function (error) {
                    var strMessage = 'Unknown Error';

                    // Check for known errors
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            strMessage = 'Access to your location is turned off. Change your settings to turn it back on.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            strMessage = 'Data from location services is currently unavailable.';
                            break;
                        case error.TIMEOUT:
                            strMessage = 'Location could not be determined within a specified timeout period.';
                            break;
                        default:
                            break;
                    };

                    return strMessage;
                }
            },
            // statics
            {
                // events available
                geoLocationStartedEvent: 'geoLocationStarted',
                geoLocationCompleteEvent: 'geoLocationComplete',
                geoLocationErrorEvent: 'geoLocationError'
            }),


    });

    // wire up the classes
    WinJS.Class.mix(RedBit.Location, WinJS.Utilities.eventMixin);
    WinJS.Class.mix(RedBit.Location, WinJS.Utilities.createEventProperties(
        RedBit.Location.geoLocationCompleteEvent,
        RedBit.Location.geoLocationErrorEvent,
        RedBit.Location.geoLocationStartedEvent));
})();