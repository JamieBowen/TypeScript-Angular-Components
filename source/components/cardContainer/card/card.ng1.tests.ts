import * as _ from 'lodash';

import { services } from 'typescript-angular-utilities';
import test = services.test;

import { IParentChildBehaviorService, serviceName as parentChildServiceName } from '../../../services/parentChild/parentChild.service';

import {
	ICardScope,
	ICardBehavior,
	CardController,
	moduleName,
	controllerName,
} from './card.ng1';

import * as angular from 'angular';
import 'angular-mocks';

interface ICardContainerMock {
	openCard: Sinon.SinonSpy;
}

interface ICardChildBehaviorMock {
	initCard?: Sinon.SinonSpy;
	validateCard?: Sinon.SinonSpy;
	saveCard?: Sinon.SinonSpy;
	clickCard?: Sinon.SinonSpy;
}

interface IAutosaveBehaviorMock {
	autosave: Sinon.SinonSpy;
}

describe('CardController', () => {
	let scope: ICardScope;
	let card: CardController;
	let cardContainer: ICardContainerMock;
	let $q: angular.IQService;
	let parentChild: IParentChildBehaviorService;

	beforeEach(() => {
		angular.mock.module(moduleName);

		cardContainer = {
			openCard: sinon.spy((): boolean => { return true; })
		};

		let services: any = test.angularFixture.inject('$q', parentChildServiceName);
		$q = services.$q;
		parentChild = services[parentChildServiceName];

		card = <any>{};
	});

	describe('scope', (): void => {
		it('should provide a function for collapsing the card', (): void => {
			buildController();

			card.showContent = true;

			scope.collapse();

			expect(card.showContent).to.be.false;
		});

		it('should provide a function for setting the selected property', (): void => {
			let selectSpy: Sinon.SinonSpy = sinon.spy();
			buildController();
			card.selectionChanged = selectSpy;

			expect(card.item.viewData.selected).to.not.be.true;

			scope.setSelected(true);

			expect(card.item.viewData.selected).to.be.true;

			scope.setSelected(false);

			expect(card.item.viewData.selected).to.be.false;

			sinon.assert.calledTwice(selectSpy);
		});

		it('should provide a function for refreshing the data source', (): void => {
			buildController();
			let refreshSpy: Sinon.SinonSpy = sinon.spy();
			card.refresh.subscribe(refreshSpy);

			scope.refresh();

			sinon.assert.calledOnce(<Sinon.SinonSpy>card.source.refresh);
			sinon.assert.calledOnce(refreshSpy);
		});

		it('should provide a function for removing the current item from the data source', (): void => {
			let item: any = { prop: 1 };

			buildController(item);

			scope.remove();

			sinon.assert.calledOnce(<Sinon.SinonSpy>card.source.remove);
			sinon.assert.calledWith(<Sinon.SinonSpy>card.source.remove, item);
		});
	});

	describe('toggle', (): void => {
		it('should toggle the card content', (): void => {
			buildController();

			expect(card.showContent).to.be.false;

			card.toggleContent();

			expect(card.showContent).to.be.true;

			card.toggleContent();

			expect(card.showContent).to.be.false;
		});
	});

	describe('open', (): void => {
		it('should call the opening behavior if specified to give children a chance to perform initialization when the card opens', (): void => {
			buildController();

			let childBehavior: ICardChildBehaviorMock = {
				initCard: sinon.spy(),
			};

			parentChild.registerChildBehavior(card.item, childBehavior);

			card.toggleContent();

			sinon.assert.calledOnce(childBehavior.initCard);
		});
	});

	describe('close', (): void => {
		it('should register close behavior with the parentChild service', (): void => {
			buildController();

			let behavior: ICardBehavior = parentChild.getChildBehavior<ICardBehavior>(card.item);

			expect(behavior).to.exist;
			expect(_.isFunction(behavior.close)).to.be.true;
		});

		it('should close the card content if the close behavior is called', (): void => {
			buildController();

			card.showContent = true;

			parentChild.triggerChildBehavior(card.item, (behavior: ICardBehavior): void => {
				behavior.close();
			});

			expect(card.showContent).to.be.false;
		});

		it('should return true if the card isnt open', (): void => {
			buildController();

			let autosaveBehavior: IAutosaveBehaviorMock = {
				autosave: sinon.spy((): boolean => { return true; }),
			};
			parentChild.registerChildBehavior(card.autosaveLink, <any>autosaveBehavior);

			let closed: boolean = parentChild.triggerChildBehavior(card.item, (behavior: ICardBehavior): boolean => {
				return behavior.close();
			});

			expect(closed).to.be.true;
			sinon.assert.notCalled(autosaveBehavior.autosave);
		});

		it('should close the card if autosave returns true', (): void => {
			buildController();

			card.showContent = true;

			let autosaveBehavior: IAutosaveBehaviorMock = {
				autosave: sinon.spy((): boolean => { return true; }),
			};
			parentChild.registerChildBehavior(card.autosaveLink, <any>autosaveBehavior);

			let closed: boolean = parentChild.triggerChildBehavior(card.item, (behavior: ICardBehavior): boolean => {
				return behavior.close();
			});

			expect(card.showContent).to.be.false;
			expect(closed).to.be.true;
		});
	});

	describe('validateCard', (): void => {
		it('should return the result of validation if validation behavior exists', (): void => {
			buildController();

			let childBehavior: ICardChildBehaviorMock = {
				validateCard: sinon.spy((): boolean => { return true; }),
			};
			parentChild.registerChildBehavior(card.item, childBehavior);

			let validated: boolean = card.validateCard();

			expect(validated).to.be.true;

			sinon.assert.calledOnce(childBehavior.validateCard);
		});

		it('should return true if validation behavior isnt specified', (): void => {
			buildController();

			let validated: boolean = card.validateCard();

			expect(validated).to.be.true;
		});
	});

	describe('saveCard', (): void => {
		it('should return the save promise if save behavior exists', (): void => {
			buildController();

			let childBehavior: ICardChildBehaviorMock = {
				saveCard: sinon.spy((): angular.IPromise<void> => { return $q.when(); }),
			};
			parentChild.registerChildBehavior(card.item, childBehavior);

			let promise: angular.IPromise<void> = card.saveCard();

			// verify that a promise was returned
			expect(_.isFunction(promise.then)).to.be.true;

			sinon.assert.calledOnce(childBehavior.saveCard);
		});

		it('should return an empty promise if save behavior isnt specified', (): void => {
			buildController();

			let promise: angular.IPromise<void> = card.saveCard();

			// verify that a promise was returned
			expect(_.isFunction(promise.then)).to.be.true;
		});
	});

	describe('clickCard', (): void => {
		it('should trigger click card behavior', (): void => {
			buildController();

			let childBehavior: ICardChildBehaviorMock = {
				clickCard: sinon.spy(),
			};
			parentChild.registerChildBehavior(card.item, childBehavior);

			card.clickCard();

			sinon.assert.calledOnce(childBehavior.clickCard);
		});
	});

	function buildController(item?: any): void {
		if (item == null) {
			item = {
				viewData: {},
			};
		}
		card.item = item;
		card.source = <any>{
			refresh: sinon.spy(),
			remove: sinon.spy(),
		};
		let locals: any = { $element: {} };

		let controllerResult: test.IControllerResult<CardController>
			= test.angularFixture.controllerWithBindings<CardController>(controllerName, card, locals);

		scope = <ICardScope>controllerResult.scope;
		card = controllerResult.controller;
		card.cardContainer = <any>cardContainer;

		let autosaveBehavior: IAutosaveBehaviorMock = {
			autosave: sinon.spy((): boolean => { return true; }),
		};
		parentChild.registerChildBehavior(card.autosaveLink, <any>autosaveBehavior);
	}
});
