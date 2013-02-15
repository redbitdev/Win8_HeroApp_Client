// just so we have the $ jquery style
$ = function (selector) {
    // handle dom element but need to do this better, right now it works for me :)
    if (typeof selector === "string") {
        return WinJS.Utilities.query(selector);
    }
    else if (selector.nodeType) {
        var elem = selector;
        if (elem.nodeType === 9)
            selector = 'body';
        else if (elem.nodeType === 1)
            selector = "*";//elem.localName;

        return WinJS.Utilities.query(selector, elem);
    }
}

// not from jquery but makes life easy to get the winControl for WinJS controls
WinJS.Utilities.QueryCollection.prototype.winControl = function () {
	if (this.length > 0)
		return this[0].winControl;
	else
		return undefined;
}

// gets the css value of the first element or sets the css value for the element(s)
WinJS.Utilities.QueryCollection.prototype.css = function (name, value) {
	if (typeof(name) === 'string' && typeof(value) === 'string') {
	    this.clearStyle(name);
        if(value != '')
		    this.setStyle(name, value);
		return this;
	}
	else {
	    // get the css value of the first item
	    if (typeof (name) === 'string')
	        return window.getComputedStyle(this[0], null)[name];
	    else
	        return undefined;
	}
}

// Get the combined text contents of each element in the set of matched elements, including their descendants.
WinJS.Utilities.QueryCollection.prototype.text = function (textString) {
	var that = this;
	
	if (textString) {
		// set the text
		this.forEach(function (i) {
			if (i.nodeName.toLowerCase() === 'input') {
				// it's an input node
				if (i.attributes.getNamedItem('type').nodeValue === 'text') {
					that.setAttribute('value', textString);
				}
				else {
					// TODO All other cases
				}
			}
			else {
				// just set the inner text
				i.innerText = textString;
			}
		});

		return this;
	}
	else {
		// return the value of the first element 
		if (this.length > 0) {
			var elem = this.get(0);
			if (elem) {
				if (elem.nodeName.toLowerCase() === 'input') {
					// it's an input node
					if (elem.attributes.getNamedItem('type').nodeValue.toLowerCase() === 'text') {
						return that.getAttribute('value')
					}
					else {
						// TODO All other cases 
						// TODO test this
						return that.getAttribute('value')
					}
				}
				else {
					// just return the inner text
					return elem.innerText
				}
			}
		}

		// if we get here nothing was found
		return undefined;

	}
}

// Get the HTML contents of the first element in the set of matched elements
// Set the HTML contents of each element in the set of matched elements
// html() - will get the html
// html(htmlString) - will set the html in all elements
// html(function(index, oldHtml)) - function to be called to set the html 
WinJS.Utilities.QueryCollection.prototype.html = function (e) {
    if (typeof (obj) === 'function') {
        // loop and call back the function
        this.forEach(function (item, index) {
            try {
                e(index, item.innerHTML);
            }
            catch (e) {
                // ignore errors for now ??
            }
        });
    }
    else if (e) {
        // set all the html of all elements
        this.forEach(function (i) {
            // just set the inner text
            i.innerHTML = e;
        });
        return this;
    }
    else {
        // just get the frist element html
        if (this.length > 0) {
            var elem = this.get(0);
            if (elem) {
                // just return the inner text
                return elem.innerText
            }
        }

        return undefined;
    }
}

// Get the Width of the first element in the set of matched elements
// Set the width of each element in the set of matched collection
// width() - will get the element width
// width(value) - 
WinJS.Utilities.QueryCollection.prototype.width = function (value) {

    if (value) {
        // make sure the value has px in it
        if (typeof (value) === 'number')
            value = '{0}px'.format(value);

        // set the value for all elements
        this.clearStyle('width');
        this.setStyle('width', value);
        return this;
    }
    else {
        // just get the frist element width
        if (this.length > 0) {
            var elem = this.get(0);
            if (elem) {
                // just return the inner text
                return WinJS.Utilities.getTotalWidth(elem);
            }
        }

        return undefined;
    }
}

// Get the height of the first element in the set of matched elements
// Set the height of each element in the set of matched collection
// height() - will get the element width
// height(value) - 
WinJS.Utilities.QueryCollection.prototype.height = function (value) {

    if (value) {
        // make sure the value has px in it
        if (typeof (value) === 'number')
            value = '{0}px'.format(value);

        // set the value for all elements
        this.clearStyle('height');
        this.setStyle('height', value);
        return this;
    }
    else {
        // just get the frist element width
        if (this.length > 0) {
            var elem = this.get(0);
            if (elem) {
                // just return the inner text
                return WinJS.Utilities.getTotalHeight(elem);
            }
        }

        return undefined;
    }
}

// attach a handler to an event for the elements
WinJS.Utilities.QueryCollection.prototype.bind = function (eventType, handler) {
    // TODO - need to implement siomilar to jquery but works for now
    // see http://api.jquery.com/bind/
    // bind all the elements in the collection
    this.forEach(function (i) {
        // just set the inner text
        i.addEventListener(eventType, handler, false);
    });
    return this;
}

// attach a handler to an event for the elements
// NOTE: this is not in jquery, but some devs like using this instead
WinJS.Utilities.QueryCollection.prototype.addEventListener = function (eventType, handler, capture) {
    this.forEach(function (i) {
        // just set the inner text
        i.addEventListener(eventType, handler, capture);
    });
    return this;
}