/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"jaidahzhr_rig_report/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
