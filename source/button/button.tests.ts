﻿/// <reference path='../../../typings/chai/chai.d.ts' />
/// <reference path='../../../typings/mocha/mocha.d.ts' />
/// <reference path='../../typings/angularMocks.d.ts' />
/// <reference path='../../typings/chaiAssertions.d.ts' />

import buttonModule = require('./button.module');
import __button = require('./button');
import angularFixture = require('../../test/angularFixture');

describe('ButtonController', () => {
	var scope: __button.IButtonScope;
	var button: __button.IButtonController;
	var actionSpy: Sinon.SinonSpy;

	beforeEach(() => {
		angular.mock.module(buttonModule.name);

		actionSpy = sinon.spy();
	});

	it('should update internal busy state if external busy property is set or clear', (): void => {
		button = buildController();
		scope.$digest();

		expect(button.busy).to.be.false;

		scope.busy = true;
		scope.$digest();

		expect(button.busy).to.be.true;

		scope.busy = false;
		scope.$digest();

		expect(button.busy).to.be.false;
		sinon.assert.notCalled(actionSpy);
	});

	it('should be busy after triggering the action if no promise is returned', (): void => {
		button = buildController();
		scope.$digest();

		button.trigger();
		scope.$digest();

		expect(scope.busy).to.be.true;
		expect(button.busy).to.be.true;
		sinon.assert.calledOnce(actionSpy);
	});

	describe('should finish after promise ends', (): void => {
		var deferred: ng.IDeferred<any>;

		beforeEach((): void => {
			var $q: ng.IQService = angularFixture.angularFixture.inject('$q').$q;
			deferred = $q.defer();

			actionSpy = sinon.spy((): ng.IPromise<any> => {
				return deferred.promise;
			});

			button = buildController();
			button.trigger();

			expect(button.busy).to.be.true;
		});

		it('should finish after promise completes', (): void => {
			deferred.resolve();
			scope.$digest();

			expect(button.busy).to.be.false;
		});

		it('should finish after promise fails', (): void => {
			deferred.reject();
			scope.$digest();

			expect(button.busy).to.be.false;
		});
	});

	it('should not allow triggers while busy', (): void => {
		button = buildController(true);

		expect(button.busy).to.be.true;

		button.trigger();

		sinon.assert.notCalled(actionSpy);
	});

	function buildController(busy: boolean = false): __button.IButtonController {
		var controllerResult: angularFixture.IControllerResult<__button.IButtonController>
			= angularFixture.angularFixture.controller<__button.IButtonController>(__button.controllerName, { busy: busy, action: actionSpy });

		scope = <__button.IButtonScope>controllerResult.scope;
		return controllerResult.controller;
	}
});
