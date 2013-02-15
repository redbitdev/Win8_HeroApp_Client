// wrapps the comments and issues

(function () {


    "use strict";

    var imageBlob = null;

    /********************************************************
  * New Issue and New Comment functionality
  ********************************************************/
    function initializeCommentsIssues() {
        $("#cmdNewComment").addEventListener('click', newCommentFlyout, false);
        $("#newCommentHide").addEventListener('click', function (e) { hideFlyout("newComment") }, false);
        $("#newCommentButton").addEventListener('click', addNewComment);
        $("#newCommentImageButton").addEventListener("click", loadImage, false);

        $("#cmdUpdate").addEventListener('click', updateIssue, false);
        //New Issue Hookup
        //Set up the new issue button
        $("#cmdNewIssue").addEventListener('click', newIssueFlyout, false);
        $("#newIssueHide").addEventListener('click', function (e) { hideFlyout("newIssue") }, false);

        $("#newIssueButton").addEventListener('click', function (e) {
            if ($('#command')[0].value == "update") {
                submitUpdateIssue();
            }
            else {
                addNewIssue();
            }
        });
        $("#newIssueImageButton").addEventListener("click", loadImage, false);
        $("#pickLocationButton").addEventListener("click", pickLocation, false);
    }

    function updateIssue(e) {
        resetFields();
        if (Hero.Auth.isLoggedIn) {
            var poi = Locations.selectedPoi;
            $('#newIssueTitle')[0].value = poi.title;
            $('#command')[0].value = 'update';
            $('#_id')[0].value = poi._id;
            $("#previewIssue").css("display", 'block');
            $('#pickLocationButton').css("display", "none");
            $('#categorySelect')[0].value = poi.category;
            $('#newIssueDesc')[0].value = poi.description;
            $("#previewIssue")[0].src = poi.imgUrl;
            showFlyout("newIssue");
        }
        else {
            cmdLogin.click();
        }
    }

    //show the new Issue flyout
    function newIssueFlyout() {
        resetFields();

        // hide the info box
        Finder.Home.infoBox.setOptions({ visible: false });

        // show
        if (Hero.Auth.isLoggedIn || Locations.serverSettings.allowAnonIssues) {
            showFlyout("newIssue");
        }
        else {
            cmdLogin.click();
        }
    }

    function pickLocation() {
        var center = (Finder.Home.locationPin ? Finder.Home.locationPin._location : Finder.Home.map.getCenter());
        if (!Finder.Home.pickPin) {
            Finder.Home.pickPin = new Microsoft.Maps.Pushpin(center,
                    {
                        icon: "/images/pin.png",
                        draggable: true
                    });
        }
        else {
            Finder.Home.pickPin.setLocation(center);
        }

        var id = Microsoft.Maps.Events.addHandler(Finder.Home.pickPin, 'dragend', function (e) {
            // nothing really to handle here
        });

        // center the map
        Finder.Home.map.setView({
            bounds: Microsoft.Maps.LocationRect.fromLocations([center])
        });

        // hide the info box if visible
        Finder.Home.infoBox.setOptions({ visible: false });

        // push the pin to the layer
        Finder.Home.gpsLayer.push(Finder.Home.pickPin);
    }

    function newCommentFlyout() {
        resetFields();
        if (Hero.Auth.isLoggedIn || Locations.serverSettings.allowAnonCommenting) {
            showFlyout("newComment");
        }
        else {
            cmdLogin.click();
        }
    }

    function resetFields() {
        $('#newIssueTitle')[0].value = '';
        $('#newIssueDesc')[0].value = '';
        $("#previewIssue")[0].src = '';
        $("#previewIssue").css("display", '');
        $('#pickLocationButton').css("display", "block");
        $("#command")[0].value = 'new';
        $('#txtTitle')[0].value = '';
        $("#previewComment")[0].src = '';
        $("#previewComment").css("display", '');
    }

    function submitUpdateIssue(e) {

        RedBit.WaitScreen.showWait('Please wait while we update the new issue ...', false);

        var title = $('#newIssueTitle')[0].value;
        var desc = $('#newIssueDesc')[0].value;
        var cat = $('#categorySelect')[0].value;
        var _id = $('#_id')[0].value;
        var fd = new FormData();
        fd.append("title", title);
        fd.append("description", desc);
        fd.append("category", cat);     
        fd.append("_id", _id);
        WinJS.xhr({
            type: "PUT",
            url: Finder.Config.staticUrl + "/" + _id,
            data: fd
        }).then(
            function (request) {
                RedBit.WaitScreen.hideWait('Issue Update!', 1000, false).done(function () {
                    var obtainedData = window.JSON.parse(request.responseText);
                    imageBlob = null;
                    hideFlyout("newIssue");
                    if (Locations.currentLocation)
                        Finder.Home.getData()
                    else
                        Finder.Home.getCurrentLocation(true);

                    // clear the fields
                    resetFields();
                });
            },
            function (request, one) {
                RedBit.WaitScreen.hideWait('Sorry we could not submit the new issue :( Please try again.', 1000, false).done(function () {
                });
                var r = request;
            });
    }

    function addNewIssue(e) {

        RedBit.WaitScreen.showWait('Please wait while we submit the new issue ...', false);

        var title = $('#newIssueTitle')[0].value;
        var desc = $('#newIssueDesc')[0].value;
        var cat = $('#categorySelect')[0].value;

        var fd = new FormData();
        fd.append("title", title);
        fd.append("description", desc);
        fd.append("openedDt", new Date());
        fd.append("category", cat);
        if (Hero.Auth.isLoggedIn)
            fd.append("email", Hero.Auth.currentUser.email);
        else
            fd.append("email", 'anonymous');
        fd.append('isAnon', !Hero.Auth.isLoggedIn);
        if (Finder.Home.pickPin) {
            fd.append("latitude", Finder.Home.pickPin._location.latitude);
            fd.append("longitude", Finder.Home.pickPin._location.longitude);
        }
        fd.append("imgData", imageBlob);

        WinJS.xhr({
            type: "POST",
            url: Finder.Config.staticUrl,
            //headers: { "Content-type": "application/x-www-form-urlencoded" },
            data: fd
        }).then(
            function (request) {
                RedBit.WaitScreen.hideWait('Issue submitted!', 1000, false).done(function () {
                    if (!Locations.serverSettings.autoApproveIssues) {
                        RedBit.Utilities.showMessage('Your issue has been submitted but the issue must be approved before being publically available. You will not see the issue right away.', 'Issue Submitted');
                    }
                    var obtainedData = window.JSON.parse(request.responseText);
                    imageBlob = null;
                    hideFlyout("newIssue");
                    if (Locations.currentLocation)
                        Finder.Home.getData()
                    else
                        Finder.Home.getCurrentLocation(true);

                    // clear the fields
                    resetFields();
                });
            },
            function (request, one) {
                RedBit.WaitScreen.hideWait('Sorry we could not submit the new issue :( Please try again.', 1000, false).done(function () {
                });
                var r = request;
            });
    }

    function addNewComment(e) {

        RedBit.WaitScreen.showWait('Please wait while we submit the comment ...', false);

        var title = $('#txtTitle')[0].value;

        var fd = new FormData();
        fd.append("text", title);
        if (Hero.Auth.isLoggedIn) {
            fd.append("email", Hero.Auth.currentUser.email);
            fd.append("name", Hero.Auth.currentUser.name);
            fd.append("profilePicUrl", Hero.Auth.currentUser.imgUrl);
        }
        else {
            fd.append("email", 'anonymous');
            fd.append("name", 'anonymous');
            fd.append("profilePicUrl", 'anonymous');
        }
        fd.append("dt", new Date());
        fd.append("imgData", imageBlob);

        WinJS.xhr({
            type: "POST",
            url: Finder.Config.staticUrl + "/" + Locations.selectedPoi._id + "/comment",
            data: fd
        }).then(
            function (request) {
                RedBit.WaitScreen.hideWait('Comment submitted!', 1000, false).done(function () {
                    if (!Locations.serverSettings.autoApproveComments) {
                        RedBit.Utilities.showMessage('Your comment has been submitted but the issue must be approved before being publically available. You will not see the comment right away.', 'Comment Submitted');
                    }
                    var res = window.JSON.parse(request.responseText);
                    imageBlob = null;
                    hideFlyout("newComment");

                    if (Locations.currentLocation)
                        Finder.Home.getData();
                    else
                        Finder.Home.getCurrentLocation(true);

                    // clear the fields
                    resetFields()
                });
            },
            function (request, one) {
                RedBit.WaitScreen.hideWait('Sorry we could not submit the comment :( Please try again.', 1000, false).done(function () {
                });
                var r = request;
            });
    }

    function loadImage(eventInfo) {
        var picker = new Windows.Storage.Pickers.FileOpenPicker();
        picker.fileTypeFilter.replaceAll([".jpg", ".bmp", ".gif", ".png"]);
        picker.pickSingleFileAsync().then(function (file) { processResults(file, eventInfo.target.id) }, null);
    }

    function processResults(file, target) {
        if (file) {
            file.openAsync(Windows.Storage.FileAccessMode.read).then(function (stream) {
                imageBlob = MSApp.createBlobFromRandomAccessStream(file.contentType, stream);
                if (target === "newCommentImageButton") {
                    $("#previewComment")[0].src = URL.createObjectURL(file);
                    $("#previewComment").css("display", 'block');
                }
                if (target === "newIssueImageButton") {
                    $("#previewIssue")[0].src = URL.createObjectURL(file);
                    $("#previewIssue").css("display", 'block');
                }
            });
        }
        //TODO: show an image
    }

    function showFlyout(elementId) {

        return new WinJS.Promise(function (c) {
            if ($('#' + elementId).css('visibility') === 'hidden') {
                $('#' + elementId).css('visibility', 'visible')
                                       .css('opacity', '1')
                                       .css('z-index', '9999')
                                       .css('height', screen.height);
                WinJS.UI.Animation.showPanel($(elementId)[0]).done(function () {
                    Finder.Home.hideAllAppBars();

                    // set the width of the map
                    $('#mapdiv').css('float', 'left');

                    // callback
                    c();
                });
            }
            else
                c();
        });
    }

    function hideFlyout(elementId) {
        return new WinJS.Promise(function (c) {
            // remove the pin from the map
            if (elementId != 'newComment')
                Finder.Home.gpsLayer.remove(Finder.Home.pickPin);

            if ($('#' + elementId).css('visibility') === 'visible') {
                $('#' + elementId).css('visibility', 'hidden')
                                       .css('opacity', '0')
                                       .css('height', 0);
                WinJS.UI.Animation.hidePanel($(elementId)[0]).done(function () {;
                    // set the width of the map
                    $('#mapdiv').css('width', '');
                    $('#mapdiv').css('float', '');

                    c();
                });
            }
            else
                c();
        });
    }

    WinJS.Namespace.define("Finder.Home", {
        initializeCommentsIssues:initializeCommentsIssues,
        addNewIssue: addNewIssue,
        addNewComment: addNewComment,
        loadImage: loadImage,
        hideFlyout: hideFlyout,
        newIssueVisible: {
            get: function () { return $('#newIssue').css('visibility') === 'visible'; }
        }
    });

})();