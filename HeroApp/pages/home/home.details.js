// Seperated the function as the main home.js was getting way to big
(function () {
    "use strict";
    WinJS.Namespace.define("Finder.Home", {

        // setup list view
        initializeDetailsView: function () {

            var data = Locations.selectedPoi;

            appBar.winControl.disabled = true;

            // setup the document elements
            $('#pageDetails .title-header .title').text(data[Finder.Config.nameField]);
           // document.getElementById("address").textContent = data.address;
            document.getElementById("infoDiv").innerHTML = Finder.Formatter.format(Finder.Config.infoFormat, data);
            document.getElementById("detailImg").src = data.imgUrl;
            document.getElementById("cmdDelete").addEventListener('click', deleteIssue, false);
            // setup sharing for details
            Finder.Home.setupListSharing(false);
            Finder.Home.setupDetailsSharing(true);

            // create the map
            WinJS.Promise.timeout(200).done(function () {
                Finder.Home.createMap(data);
            });

            // wire up the back button for list
            $('.details .title-header .win-backbutton')[0].addEventListener('click', Finder.Home.hideDetailsView);
            showComments();
            document.getElementById("detailsMain").scrollLeft = 0;
        },

        // variable to hold which element called this
        _callFromElement: '#main',

        // determins if the details are visible
        detailsVisible: {
            get:function() {
                return $('#pageDetails').css('visibility') === 'visible';
            }
        },

        // wires up the details sharing
        setupDetailsSharing: function (enable) {
            // setup sharing for details
            var dtm = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            if (enable) {
                Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView().addEventListener('datarequested', detailsShareDataRequested);
            }
            else {
                Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView().removeEventListener('datarequested', detailsShareDataRequested);
            }
        },

        // hide the details view
        hideDetailsView: function () {

            // hide the comment flyout
            Finder.Home.hideFlyout('newComment');

            // re-enable the appbars
            Finder.Home.hideAllAppBars();
            appBar.winControl.disabled = false;

            // unwire back button
            $('.details .title-header .win-backbutton')[0].removeEventListener('click', Finder.Home.hideDetailsView);

            // unwire sharing
            Finder.Home.setupDetailsSharing(false);
            Finder.Home.setupListSharing(true);

            // show the details
            return new WinJS.Promise(function (c) {
                if ($('#pageDetails').css('visibility') === 'visible') {
                    // set the width of the map
                    WinJS.UI.Animation.exitContent($('#pageDetails')[0]).done(function () {
                        $(Finder.Home._callFromElement).css('display', '');
                        $('#pageDetails').css('visibility', 'hidden')
                                           .css('opacity', '0')
                                           .css('display', 'none');
                        WinJS.UI.Animation.enterContent($(Finder.Home._callFromElement)[0]).done(function () {
                            $(Finder.Home._callFromElement)
                                .css('visibility', 'visible')
                                .css('opacity', '1');

                            c();
                            // this is here user has navigated back
                            if (Finder.Home._doneCallback)
                                Finder.Home._doneCallback(true);
                        });
                    });
                }
                else {
                    c();
                    // this is here user has navigated back
                    if (Finder.Home._doneCallback)
                        Finder.Home._doneCallback(true);
                }
            });
        },

        // shows or hides the details view
        showDetailsView: function (callFromElement, doneCallback) {
            // disenable the appbars
            Finder.Home.hideAllAppBars();
            detailsAppBar.winControl.disabled = false;

            // save reference to the element that called this
            Finder.Home._callFromElement = callFromElement;
            Finder.Home._doneCallback = doneCallback;


            // setup the view
            Finder.Home.initializeDetailsView();

            // show the list
            return new WinJS.Promise(function (c) {
                // cross fade the list and the map
                if ($('#pageDetails').css('visibility') === 'hidden') {
                    $('#pageDetails').css('visibility', 'visible')
                                     .css('opacity', '0')
                                     .css('display', '');
                    WinJS.UI.Animation.exitContent($(Finder.Home._callFromElement)[0]).done(function () {
                        $(Finder.Home._callFromElement).css('display', 'none');
                        WinJS.UI.Animation.enterContent($('#pageDetails')[0]).done(function () {
                            c();
                            // this is here to callback when we are done showing the details page
                            if (Finder.Home._doneCallback)
                                Finder.Home._doneCallback(false);
                        });
                    });
                }
                else {
                    c();
                    // this is here to callback when we are done showing the details page
                    if (Finder.Home._doneCallback)
                        Finder.Home._doneCallback(false);
                }
            });
        },

        createMap: function (data) {

            // get the container
            var container = $('#pageDetails #mapDivImage');

            // create the map image div
            var mapdiv = document.createElement('div');
            mapdiv.className = 'mapImage';
            var img = document.createElement('img');

            // calcluate width height make sure it's not above api values
            var w = container.width();
            if (w > 900)
                w = 800;
            var h = container.height();
            if (h > 834)
                h = 834;

            // set the image source
            img.src = 'http://dev.virtualearth.net/REST/V1/Imagery/Map/road/{0},{1}/13?mapsize={2},{3}&pp={0},{1};1;&key={4}'.format(
                data._location.latitude,
                data._location.longitude,
                w,
                h,
                Finder.Config.bingMapsKey);

            // add the image to the map div
            mapdiv.appendChild(img);

            // set the html
            container.html(mapdiv.outerHTML);
        }
    });

    function detailsShareDataRequested(e) {
        var deferral = e.request.getDeferral();
        e.request.data.properties.title = Finder.Formatter.format(Finder.Config.shareTitle, Locations.selectedPoi);
        e.request.data.properties.description = Finder.Formatter.format(Finder.Config.shareDescription, Locations.selectedPoi);
        e.request.data.setText(Finder.Formatter.format(Finder.Config.shareText, Locations.selectedPoi));
        deferral.complete();
    }

    function deleteIssue(e) {
        var data = Locations.selectedPoi;

        if (data.comments.length !== 0) {
            (new Windows.UI.Popups.MessageDialog("You Can't delete issues that have been commented on.")).showAsync();
            return;
        }
        var msg = new Windows.UI.Popups.MessageDialog("Are you sure you want to delete this issue?");
        msg.commands.append(new Windows.UI.Popups.UICommand("Delete", confirmedDelete));
        msg.commands.append(new Windows.UI.Popups.UICommand("Cancel", null));

        // Set the command that will be invoked by default
        msg.defaultCommandIndex = 0;

        // Set the command to be invoked when escape is pressed
        msg.cancelCommandIndex = 1;

        // Show the message dialog
        msg.showAsync();
    }

    function confirmedDelete() {
        WinJS.xhr({ type: "DELETE", url: Finder.Config.staticUrl + "/" + Locations.selectedPoi._id })
            .then(
                   function (request) {
                       var res = window.JSON.parse(request.responseText);
                       Finder.Home.hideDetailsView();
                   });
    }

   

    function showComments() {
        var productTemplate = new WinJS.Binding.Template(document.getElementById("commentTemplate"));
        var productContainer = document.getElementById("commentDiv");
        productContainer.innerHTML = "";

        var locs = Locations.selectedPoi.comments;
        var i, loc;
        for (i = 0; i < locs.length; i++) {
            loc = locs[i];
           
            //Add in the name field
            //loc.name = loc.text;
           // loc.secondary = loc[Finder.Config.secondaryField];
           // loc.img_url = loc[Finder.Config.imageField];
            productTemplate.render(loc).then(function (result) {
                result.data = loc;
               // result.addEventListener("click", rowClick);
                productContainer.appendChild(result);
            });
        }
    }
    
})();