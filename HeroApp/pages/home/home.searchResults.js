// For an introduction to the Search Contract template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232512

// TODO: Add the following script tag to the start page's head to
// subscribe to search contract events.
//  
// <script src="/pages/search/searchResults.js"></script>
//
// TODO: Edit the manifest to enable use as a search target.  The package 
// manifest could not be automatically updated.  Open the package manifest file
// and ensure that support for activation of searching is enabled.

(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var appModel = Windows.ApplicationModel;
    var appViewState = Windows.UI.ViewManagement.ApplicationViewState;
    var nav = WinJS.Navigation;
    var ui = WinJS.UI;
    var utils = WinJS.Utilities;
    var searchPageURI = "/pages/search/searchResults.html";

    WinJS.Namespace.define('Finder.Home', {
        _filters: [],
        _lastSearch: "",

        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        invokeSearch: function (element, options) {
            var that = this;

            var listView = element.querySelector(".resultslist").winControl;
            listView.itemTemplate = function (promise) {
                return promise.then(function (item) {
                    var div = document.createElement('div');
                    div.className = 'item';

                    //create content div
                    var contentDiv = document.createElement('div');
                    contentDiv.className = 'item-content';

                    // create the headers
                    var h3 = document.createElement('h3');
                    h3.className = 'item-title win-type-x-small win-type-ellipsis';
                    h3.innerText = item.data[Finder.Config.nameField];
                    contentDiv.appendChild(h3);
                    var h4 = document.createElement('h4');
                    h4.className = 'item-subtitle win-type-x-small win-type-ellipsis';
                    h4.innerText = item.data[Finder.Config.secondaryField];
                    contentDiv.appendChild(h4);

                    // add to main div
                    div.appendChild(contentDiv);

                    // return
                    return div;
                });
            };

            listView.oniteminvoked = that._itemInvoked;
            that._handleQuery(element, options);
            listView.element.focus();

            // show search
            this._hideSearch.bind(this);
            this._showSearch().done(function () {
                // wire up the back button for list
                $('.searchResults #header .win-backbutton').addEventListener('click', that._hideSearch);
            });
        },

        // shows the search div
        _showSearch: function () {
            // determin the elem
            var elem = "#main";
            if (Finder.Home.detailsVisible)
                elem = "#pageDetails";

            return new WinJS.Promise(function (c) {
                if ($('.searchResults').css('visibility') === 'hidden') {
                    $('.searchResults').css('visibility', 'visible')
                                           .css('opacity', '0')
                                           .css('display', '');
                    WinJS.UI.Animation.exitContent($(elem)[0]).done(function () {
                        $(elem).css('display', 'none')
                               .css('visibility', 'hidden');
                        WinJS.UI.Animation.enterContent($('.searchResults')[0]).done(function () {
                            c();
                        });
                    });
                }
                else {
                    c();
                }
            });
        },

        // hides the search div
        _hideSearch: function () {
            $('.searchResults #header .win-backbutton').removeEventListener('click', this._hideSearch);

            var elem = "#main";
            if (Finder.Home.detailsVisible)
                elem = "#pageDetails";
            return new WinJS.Promise(function (c) {
                if ($('.searchResults').css('visibility') === 'visible') {
                    $(elem).css('display', '');
                    // set the width of the map
                    WinJS.UI.Animation.exitContent($('.searchResults')[0]).done(function () {
                        $(elem)
                            .css('visibility', '')
                            .css('display', '');
                        WinJS.UI.Animation.enterContent($(elem)[0]).done(function () {
                            $('.searchResults').css('visibility', 'hidden')
                                           .css('opacity', '0')
                                           .css('display', 'none');
                            $(elem)
                                .css('opacity', '')
                                .css('visibility', '')
                                .css('display', '');
                            c();
                        });
                    });
                }
                else {
                    c();
                }
            });
        },

        // This function updates the page layout in response to viewState changes.
        searchUpdateLayout: function (element, viewState, lastViewState) {
            /// <param name="element" domElement="true" />

            var listView = element.querySelector(".resultslist").winControl;
            if (lastViewState !== viewState) {
                if (lastViewState === appViewState.snapped || viewState === appViewState.snapped) {
                    var handler = function (e) {
                        listView.removeEventListener("contentanimating", handler, false);
                        e.preventDefault();
                    }
                    listView.addEventListener("contentanimating", handler, false);
                    var firstVisible = listView.indexOfFirstVisible;
                    this._initializeLayout(listView, viewState);
                    if (firstVisible >= 0 && listView.itemDataSource.list.length > 0) {
                        listView.indexOfFirstVisible = firstVisible;
                    }
                }
            }
        },

        // This function filters the search data using the specified filter.
        _applyFilter: function (filter, originalResults) {
            if (filter.results === null) {
                filter.results = originalResults.createFiltered(filter.predicate);
            }
            return filter.results;
        },

        // This function responds to a user selecting a new filter. It updates the
        // selection list and the displayed results.
        _filterChanged: function (element, filterIndex) {
            var filterBar = element.querySelector(".filterbar");
            var listView = element.querySelector(".resultslist").winControl;

            utils.removeClass(filterBar.querySelector(".highlight"), "highlight");
            utils.addClass(filterBar.childNodes[filterIndex], "highlight");

            element.querySelector(".filterselect").selectedIndex = filterIndex;

            listView.itemDataSource = this._filters[filterIndex].results.dataSource;
        },

        _generateFilters: function () {
            this._filters = [];
            this._filters.push({ results: null, text: "All", predicate: function (item) { return true; } });

            // TODO: Replace or remove example filters.
           /* this._filters.push({ results: null, text: "Group 1", predicate: function (item) { return item.group.key === "group1"; } });
            this._filters.push({ results: null, text: "Group 2+", predicate: function (item) { return item.group.key !== "group1"; } });*/
        },

        // This function executes each step required to perform a search.
        _handleQuery: function (element, args) {
            var originalResults;
            this._lastSearch = args.queryText;
            WinJS.Namespace.define("searchResults", { markText: WinJS.Binding.converter(this._markText.bind(this)) });
            this._initializeLayout(element.querySelector(".resultslist").winControl, Windows.UI.ViewManagement.ApplicationView.value);
            this._generateFilters();
            originalResults = this._searchData(args.queryText);
            if (originalResults.length === 0) {
                document.querySelector('.filterarea').style.display = "none";
            } else {
                document.querySelector('.resultsmessage').style.display = "none";
            }
            this._populateFilterBar(element, originalResults);
            this._applyFilter(this._filters[0], originalResults);
        },

        // This function updates the ListView with new layouts
        _initializeLayout: function (listView, viewState) {
            /// <param name="listView" value="WinJS.UI.ListView.prototype" />

            if (viewState === appViewState.snapped) {
                listView.layout = new ui.ListLayout();
                document.querySelector(".titlearea .pagetitle").textContent = '“' + this._lastSearch + '”';
                document.querySelector(".titlearea .pagesubtitle").textContent = "";
            } else {
                listView.layout = new ui.GridLayout();

                // TODO: Change "App Name" to the name of your app.
                document.querySelector(".titlearea .pagetitle").textContent = Finder.Config.appName;
                document.querySelector(".titlearea .pagesubtitle").textContent = "Results for “" + this._lastSearch + '”';
            }
        },

        _itemInvoked: function (args) {
            args.detail.itemPromise.done(function itemInvoked(item) {
                // TODO: Navigate to the item that was invoked.
                Locations.selectedPoi = item.data;
                Finder.Home.showDetailsView('.searchResults', function (done) {
                    
                });
                //WinJS.Navigation.navigate("/pages/details/details.html", item.data);
            });
        },

        // This function colors the search term. Referenced in /pages/search/searchResults.html
        // as part of the ListView item templates.
        _markText: function (text) {
            //TODO: re-add this
           // text = "<span>" + text + "</span>";
           // return text.replace(this._lastSearch, "<mark>" + this._lastSearch + "</mark>");
        },

        // This function generates the filter selection list.
        _populateFilterBar: function (element, originalResults) {
            var filterBar = element.querySelector(".filterbar");
            var listView = element.querySelector(".resultslist").winControl;
            var li, option, filterIndex;

            filterBar.innerHTML = "";
            for (filterIndex = 0; filterIndex < this._filters.length; filterIndex++) {
                this._applyFilter(this._filters[filterIndex], originalResults);

                li = document.createElement("li");
                li.filterIndex = filterIndex;
                li.tabIndex = 0;
                li.textContent = this._filters[filterIndex].text + " (" + this._filters[filterIndex].results.length + ")";
                li.onclick = function (args) { this._filterChanged(element, args.target.filterIndex); }.bind(this);
                li.onkeyup = function (args) {
                    if (args.key === "Enter" || args.key === "Spacebar")
                        this._filterChanged(element, args.target.filterIndex);
                }.bind(this);
                utils.addClass(li, "win-type-interactive");
                utils.addClass(li, "win-type-x-large");
                filterBar.appendChild(li);

                if (filterIndex === 0) {
                    utils.addClass(li, "highlight");
                    listView.itemDataSource = this._filters[filterIndex].results.dataSource;
                }

                option = document.createElement("option");
                option.value = filterIndex;
                option.textContent = this._filters[filterIndex].text + " (" + this._filters[filterIndex].results.length + ")";
                element.querySelector(".filterselect").appendChild(option);
            }

            element.querySelector(".filterselect").onchange = function (args) { this._filterChanged(element, args.currentTarget.value); }.bind(this);
        },

        // This function populates a WinJS.Binding.List with search results for the
        // provided query.
        _searchData: function (queryText) {
            var originalResults;
            // TODO: Perform the appropriate search on your data.


            if (window.Data) {
                originalResults = Data.items.createFiltered(function (item) {
                    return (item.title.indexOf(queryText) >= 0 || item.subtitle.indexOf(queryText) >= 0 || item.description.indexOf(queryText) >= 0);
                });
            } else {
                originalResults = new WinJS.Binding.List(Finder.Data.search(queryText));
            }
            return originalResults;
        }
    });

    WinJS.Application.addEventListener("activated", function (args) {
        if (args.detail.kind === appModel.Activation.ActivationKind.search) {
            args.setPromise(ui.processAll().then(function () {
                Finder.Home.invokeSearch($('.searchResults')[0], args.detail);
            }));
        }
    });

    appModel.Search.SearchPane.getForCurrentView().onquerysubmitted = function (args) { Finder.Home.invokeSearch($('.searchResults')[0], args); };
})();
