import { promisify } from 'util';
import { dontWait } from '../../src/dont-wait';
const wait = promisify(setTimeout);

describe(dontWait.name, () => {
	let callback: jest.SpyInstance;
	let errorCallback: jest.SpyInstance;

	beforeEach(() => {
		callback = jest.fn().mockResolvedValue('something');
		errorCallback = jest.fn();
	});

	it('should execute callback on the next tick', async () => {
		dontWait(callback as any);

		expect(callback).toHaveCallsLike();

		await wait(1);

		expect(callback).toHaveCallsLike([]);
	});

	it('should execute dontWait() error callback on the next tick', async () => {
		const error = new Error();
		callback.mockRejectedValue(error);

		dontWait(callback as any, errorCallback as any);

		expect(callback).toHaveCallsLike();
		expect(errorCallback).toHaveCallsLike();

		await wait(1);

		expect(callback).toHaveCallsLike([]);
		expect(errorCallback).toHaveCallsLike([error]);
	});
});
