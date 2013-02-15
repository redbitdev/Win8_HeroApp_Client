(function () {

    WinJS.Namespace.define("Hero.Auth", {
        isLoggedIn: false,
        currentUser: null,
        authzInProgress: false,
        accessToken: undefined,

        initializeAuth: function () {
            // check the settings to see if we have been authorized before and setup as needed
            Hero.Auth.currentUser = RedBit.Settings.instance.currentUser;
            Hero.Auth.accessToken = RedBit.Settings.instance.accessToken;
            Hero.Auth.isLoggedIn = RedBit.Settings.instance.isLoggedIn;
        },

        login: function (callback) {
            if (Finder.Config.oAuthLoginProvider === 'facebook') {
                launchFacebookWebAuth(function () {
                    // set any variables for caching
                    RedBit.Settings.instance.currentUser = Hero.Auth.currentUser
                    RedBit.Settings.instance.accessToken = Hero.Auth.accessToken;
                    RedBit.Settings.instance.isLoggedIn = Hero.Auth.isLoggedIn;

                    // callback
                    callback();
                });
            }
        },

        logout: function () {
            this.isLoggedIn = false;
            this.currentUser = null;

            // persist changes
            RedBit.Settings.instance.currentUser = undefined;
            RedBit.Settings.instance.accessToken = undefined;
            RedBit.Settings.instance.isLoggedIn = undefined;
        }
    });

    function launchFacebookWebAuth(callback) {
        var facebookURL = "https://www.facebook.com/dialog/oauth?client_id=";
        var clientID = Finder.Config.oAuthKey;
        var callbackURL = "https://www.facebook.com/connect/login_success.html";
        facebookURL += clientID + "&redirect_uri=" + encodeURIComponent(callbackURL) + "&scope=email&display=popup&response_type=token";

        if (Hero.Auth.authzInProgress) {
            msg("Authorization already in Progress ...");
            return;
        }

        var startURI = new Windows.Foundation.Uri(facebookURL);
        var endURI = new Windows.Foundation.Uri(callbackURL);

        Hero.Auth.authzInProgress = true;
        Windows.Security.Authentication.Web.WebAuthenticationBroker.authenticateAsync(
            Windows.Security.Authentication.Web.WebAuthenticationOptions.none, startURI, endURI)
            .done(function (result) {
                var accessToken = parseAccessToken(result.responseData);

                if (accessToken) {
                    var userUrl = "https://graph.facebook.com/me?fields=email&format=json&access_token=" + accessToken;

                    WinJS.xhr({ url: userUrl }).then(function (response) {
                        Hero.Auth.currentUser = JSON.parse(response.responseText);

                        WinJS.xhr({ url: "https://graph.facebook.com/" + Hero.Auth.currentUser.id }).then(function (res) {
                            var profile = JSON.parse(res.responseText);
                            Hero.Auth.currentUser.name = profile.name;
                            Hero.Auth.currentUser.imgUrl = "https://graph.facebook.com/" + Hero.Auth.currentUser.id + "/picture?type=large";
                            Hero.Auth.isLoggedIn = true;
                            Hero.Auth.authzInProgress = false;
                            Hero.Auth.accessToken = accessToken;
                            // callback caller
                            callback();
                        });
                    });
                }
                else {
                    Hero.Auth.authzInProgress = false;
                }
                    
            }, function (err) {
                msg("Error returned by WebAuth broker: " + err);
                Hero.Auth.authzInProgress = false;
            });
    }

    function loginWithWindowsLive(callback) {
        WL.init({
        });

        WL.login({
            scope: ["wl.signin", "wl.basic", "wl.birthday", "wl.emails"]
        }, function (one, two, three) {
            var x = 0;
        }
        ).then(
           function (response) {
               var a = response;
               WL.api({
                   path: "me",
                   method: "GET"
               }).then(
                   function (response) {
                       user = response;
                   },
                   function (responseFailed) {
                       msg("Error calling API: " + responseFailed.error.message );
                   }
               );
           },
           function (responseFailed) {
               msg("Error signing in: " + responseFailed.error_description);
           }
       );
    }

    function parseAccessToken(url) {
        var start = url.indexOf("#access_token") + 14;
        if (start === 13) return null;
        var end = url.indexOf("&expires_in");
        return url.substring(start, end);
    }

    function msg(message) {
        (new Windows.UI.Popups.MessageDialog(message)).showAsync();
    }
})();