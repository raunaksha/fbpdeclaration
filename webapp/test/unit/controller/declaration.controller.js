/*global QUnit*/

sap.ui.define([
	"fbpprestige/fbpdeclaration/controller/declaration.controller"
], function (Controller) {
	"use strict";

	QUnit.module("declaration Controller");

	QUnit.test("I should test the declaration controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
