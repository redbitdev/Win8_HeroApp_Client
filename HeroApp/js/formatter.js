(function () {
    WinJS.Namespace.define("Finder.Formatter", {
        tokens : [ "nameField", "description" ],
        format: function (string, data) {
            var self = this;
            for (var i in self.tokens) {
                var token = self.tokens[i];
                //Special case the name field
                var realToken = token;
                if (token == "nameField")
                    realToken = Finder.Config.nameField;
                string = string.replace("{{" + token + "}}", data[realToken]);
            }
            return string;
        }

    });


})()