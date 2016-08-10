import { addProviders, inject } from '@angular/core/testing';

import { services } from 'typescript-angular-utilities';
import test = services.test;
import fakeAsync = test.fakeAsync;
import __object = services.object;
import __array = services.array;
import __synchronizedRequests = services.synchronizedRequests;

import { DataServiceDataSource, IAsyncDataSource } from './dataServiceDataSource.service';

import { DataSourceProcessor } from '../dataSourceProcessor.service';
import { Sorter } from '../../sorts/sorter/sorter.service';
import { MergeSort } from '../../sorts/mergeSort/mergeSort.service';

import * as _ from 'lodash';

interface IDataServiceMock {
	get<TDataType>(): angular.IPromise<TDataType[]>;
}

describe('DataServiceDataSource', () => {
	let dataSourceProcessor: DataSourceProcessor;
	let dataService: IDataServiceMock;
	let arrayUtility: __array.ArrayUtility;
	let synchronizedRequestsFactory: __synchronizedRequests.SynchronizedRequestsFactory;

	beforeEach(() => {
		addProviders([
			DataSourceProcessor,
			Sorter,
			MergeSort,
			services.UTILITY_PROVIDERS,
		]);
		inject([DataSourceProcessor, __array.ArrayUtility, __synchronizedRequests.SynchronizedRequestsFactory]
			, (_dataSourceProcessor, _array, _synchronizedRequestsFactory) => {

			dataSourceProcessor = _dataSourceProcessor;
			sinon.spy(dataSourceProcessor, 'processAndCount');
			arrayUtility = _array;
			synchronizedRequestsFactory = _synchronizedRequestsFactory;
		})();

		dataService = <any> {};
	});

	describe('loading', (): void => {
		it('should call data processor to process the data when refreshing', fakeAsync((): void => {
			dataService.get = test.mock.promise([1, 2, 3]);

			new DataServiceDataSource(dataService.get, dataSourceProcessor, arrayUtility, synchronizedRequestsFactory);
			test.mock.flushAll(dataService)

			sinon.assert.calledOnce(<Sinon.SinonSpy>dataSourceProcessor.processAndCount);
		}));

		it('should make an initial request to the server for data', fakeAsync((): void => {
			dataService.get = test.mock.promise([1, 2]);

			let source: IAsyncDataSource<number> = new DataServiceDataSource<number>(dataService.get, dataSourceProcessor, arrayUtility, synchronizedRequestsFactory);

			let reloadedSpy: Sinon.SinonSpy = sinon.spy();
			source.reloaded.subscribe(reloadedSpy);
			let changedSpy: Sinon.SinonSpy = sinon.spy();
			source.changed.subscribe(changedSpy);

			test.mock.flushAll(dataService);

			expect(source.dataSet).to.have.length(2);
			expect(source.dataSet[0]).to.equal(1);
			expect(source.dataSet[1]).to.equal(2);
			expect(source.count).to.equal(2);

			sinon.assert.calledOnce(reloadedSpy);
			sinon.assert.calledOnce(changedSpy);
		}));
	});
});
