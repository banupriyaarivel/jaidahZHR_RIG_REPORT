/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"jaidahZHR_RIG_REPORT2/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
