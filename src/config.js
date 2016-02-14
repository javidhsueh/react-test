'use strict';

import Constant from './constant';

var Config = {
	currentMode: Constant.Mode.HAND,
	minZoomScale: 0.1,
	mouseMoveThrottle: 10,
	nodeRadius: 0.05,
	scale: 0.9,
	scrollStep: 0.003
};

module.exports = Config;
