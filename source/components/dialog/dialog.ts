// /// <reference path='../../../typings/node/node.d.ts' />
// /// <reference path='../../../typings/jquery/jquery.d.ts' />

'use strict';

import * as angular from 'angular';

import { IAutosaveDialogScope } from '../../services/autosaveDialog/autosaveDialog.service';
import { IFormValidator } from '../../types/formValidators';

export let moduleName: string = 'rl.ui.components.dialog';
export let directiveName: string = 'rlDialog';
export let controllerName: string = 'DialogController';

export interface IDialogScope extends angular.IScope {
	dialogForm: IFormValidator;
	$parent: IParentScope;
}

export interface IParentScope extends angular.IScope {
	$close: { (): void };
	$dismiss: { (): void };
}

export interface IDialogBindings {
	autosave: boolean;
}

export class DialogController implements IDialogBindings {
	autosave: boolean;
	hasFooter: boolean;
	close: { (): void };
	dismiss: { (): void };

	static $inject: string[] = ['$scope'];
	constructor(private $scope: IDialogScope) {}

	$onInit(): void {
		let unbind: Function = this.$scope.$watch('dialogForm', (form: IFormValidator): void => {
			let autosaveScope: IAutosaveDialogScope = <any>this.$scope.$parent;
			autosaveScope.setForm(form);
			unbind();
		});
	}
}

dialog.$inject = ['$compile'];
function dialog($compile: angular.ICompileService): angular.IDirective {
	'use strict';
	return {
		restrict: 'E',
		transclude: {
			headerSlot: '?rlDialogHeader',
			contentSlot: '?rlDialogContent',
			footerSlot: '?rlDialogFooter',
		},
		template: require('./dialog.html'),
		controller: controllerName,
		controllerAs: 'dialog',
		scope: {},
		bindToController: {
			autosave: '=',
		},
		link(scope: IDialogScope
			, element: angular.IAugmentedJQuery
			, attrs: angular.IAttributes
			, controller: DialogController
			, transclude: angular.ITranscludeFunction): void {
			controller.close = scope.$parent.$close;
			controller.dismiss = scope.$parent.$dismiss;
			let footerArea: JQuery = element.find('.footer-template');

			if (transclude.isSlotFilled('footerSlot')) {
				transclude((footer: JQuery): void => {
					controller.hasFooter = (footer.length > 0);
					if (controller.hasFooter) {
						footerArea.append(footer);
					}
				}, null, 'footerSlot');
			} else if (controller.autosave) {
				let footer: JQuery = $compile(require('./autosaveDialogFooter.html'))(scope);
				controller.hasFooter = true;
				footerArea.append(footer);
			}
		},
	};
}

angular.module(moduleName, [])
	.directive(directiveName, dialog)
	.controller(controllerName, DialogController);
