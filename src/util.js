'use strict';

var Util = {

	getSpaceRectangle(x1, y1, x2, y2) {
		//max and min is flipped for y as it is window coordinates
		return [
			Math.min(x1, x2),
			Math.max(y1, y2),
			Math.max(x1, x2),
			Math.min(y1, y2)
		];	
	},

	insidePolygon(x, y) {
		// TODO: we should shift the code in index.js to here
		return false
	},

	screentoSpaceX(value) {
		//  TODO: shift the code in index.js to here
	},

	screentoSpaceY(value) {
		//  TODO: shift the code in index.js to here
	}
}

module.exports = Util;
