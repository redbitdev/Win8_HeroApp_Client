(function () {
    "use strict";

    WinJS.Namespace.define("RedBit", {
        // settings helper class
        Settings: WinJS.Class.define(
                function Settings() {
                    RedBit.Settings.instance = this;
                    this.getValue.bind(this);
                    this.setValue.bind(this);
                },

                // instance
                {
                    // the current metric system used
                    unitOfMeasure: {
                        get: function () {
                            return this.getValue('unitOfMeasure', RedBit.Settings.UnitOfMeasureType.imperial);
                        },
                        set: function (value) {
                            this.setValue('unitOfMeasure', value, RedBit.Settings.unitOfMeasureChangedEvent);
                        }
                    },

                    // current access token when authenticated
                    accessToken: {
                        get: function () {
                            return this.getValue('accessToken', undefined);
                        },
                        set: function (value) {
                            this.setValue('accessToken', value, RedBit.Settings.accessTokenChangedEvent);
                        }
                    },

                    // just a check to see if logged in
                    isLoggedIn: {
                        get: function () {
                            return this.getValue('isLoggedIn', false);
                        },
                        set: function (value) {
                            this.setValue('isLoggedIn', value);
                        }
                    },

                    // current logged in user name
                    currentUser: {
                        get: function () {
                            return this.getValue('currentUser', undefined);
                        },
                        set: function (value) {
                            this.setValue('currentUser', value);
                        }
                    },

                    // gets the value from the container app settings
                    getValue: function (key, defaultValue) {
                        var container = this.ensureSettingsContainer();
                        var ret = container.values[key];
                        if (typeof (ret) === 'undefined')
                            ret = defaultValue;
                        else
                            ret = JSON.parse(ret);
                        return ret;
                    },

                    // sets the value from the container app settings
                    setValue: function (key, value, eventToDispatch) {
                        var container = this.ensureSettingsContainer();
                        container.values[key] = JSON.stringify(value);
                        if (eventToDispatch)
                            this.dispatchEvent(eventToDispatch, value);
                    },

                    // ensures the settings container is created
                    ensureSettingsContainer: function () {
                        var localSettings = Windows.Storage.ApplicationData.current.localSettings;
                        var ret = undefined;
                        if (!localSettings.containers.hasKey('RedBitSettingsContainer'))
                            ret = localSettings.createContainer('RedBitSettingsContainer', Windows.Storage.ApplicationDataCreateDisposition.always);
                        else
                            ret = localSettings.containers.lookup('RedBitSettingsContainer');

                        return ret;
                    }
                },

                // statics
                {
                    // static instance used everywhere
                    instance: undefined,

                    // metric types
                    UnitOfMeasureType: {
                        imperial: 0,
                        metric: 1,
                    },

                    // events
                    unitOfMeasureChangedEvent: 'unitOfMeasureChanged',
                    accessTokenChangedEvent: 'accessTokenChanged',
                })
    })

    // wire up the classes
    WinJS.Class.mix(RedBit.Settings, WinJS.Utilities.eventMixin);
    WinJS.Class.mix(RedBit.Settings, WinJS.Utilities.createEventProperties(
        RedBit.Settings.unitOfMeasureChangedEvent,
        RedBit.Settings.accessTokenChangedEvent));
})();