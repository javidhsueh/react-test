'use strict';

import keyMirror from 'key-mirror';

var Constant = {
	Mode: keyMirror({
		HAND: null,
		LASSO: null,
		IDK: null
	}),

	Mouse: {
		LEFT: 0,
		RIGHT: 1
	}
};

module.exports = Constant;
