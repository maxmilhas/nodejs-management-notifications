import { promisify } from 'util';
import { fluentAsync } from '@codibre/fluent-iterable';
import { GrafanaAlert } from './../../src/grafana-alert';
import { packageInfo } from './../../src/package-info';
import { Logger } from 'ts-base-http-client';
import { GrafanaClient, GrafanaSettings } from '../../src';
import * as GrafanaHttpClientLib from '../../src/grafana-http-client';
import { GrafanaHttpClient } from '../../src/grafana-http-client';

const delay = promisify(setTimeout);

describe(GrafanaClient.name, () => {
	let target: GrafanaClient;
	let client: GrafanaHttpClient;
	let config: GrafanaSettings;

	beforeEach(() => {
		client = {} as GrafanaHttpClient;
		config = {} as GrafanaSettings;
		jest
			.spyOn(GrafanaHttpClientLib, 'GrafanaHttpClient')
			.mockReturnValue(client);
		target = GrafanaClient.create(config, 'logger value' as unknown as Logger);
	});

	afterEach(() => {
		delete GrafanaClient['instance'];
	});

	it('should fill application name and version with package values when they are not informed', () => {
		expect(target['config'].applicationName).toBe(packageInfo.name);
		expect(target['config'].applicationVersion).toBe(packageInfo.version);
	});

	it('should keep informed name and version', () => {
		delete GrafanaClient['instance'];
		const target2 = GrafanaClient.create(
			{
				applicationName: 'name 1',
				applicationVersion: 'version 2',
			} as GrafanaSettings,
			undefined as any,
		);

		expect(target2['config'].applicationName).toBe('name 1');
		expect(target2['config'].applicationVersion).toBe('version 2');
	});

	it('should throw an error when instances are created twice', () => {
		let error: any;

		try {
			GrafanaClient.create(
				{
					applicationName: 'name 1',
					applicationVersion: 'version 2',
				} as GrafanaSettings,
				undefined as any,
			);
		} catch (err) {
			error = err;
		}

		expect(error).toBeInstanceOf(Error);
	});

	describe(GrafanaClient.prototype.notify.name, () => {
		const now = Date.now();

		beforeEach(() => {
			jest.spyOn(Date, 'now').mockReturnValue(now);
			client.post = jest.fn().mockResolvedValue({ id: 'id result' });
			target['config'].applicationName = 'app name';
			target['config'].applicationVersion = 'app version';
		});

		it('should send alert with only app name and app version and Date.now as time, when no defaultTags exists, no tags are informed and no time is informed', async () => {
			const result = await target.notify({
				text: 'some text',
			});

			expect(client.post).toHaveCallsLike([
				'api/annotations',
				{
					text: 'some text',
					tags: ['app name', 'app version'],
					time: now,
					timeEnd: undefined,
				},
			]);
			expect(result).toBe('id result');
		});

		it('should send alert with informed time, when time is informed', async () => {
			const result = await target.notify({
				text: 'some text',
				time: new Date(12345).toISOString(),
			});

			expect(client.post).toHaveCallsLike([
				'api/annotations',
				{
					text: 'some text',
					tags: ['app name', 'app version'],
					time: 12345,
					timeEnd: undefined,
				},
			]);
			expect(result).toBe('id result');
		});

		it('should send alert with default tags concatenated, when they exist', async () => {
			target['config'].defaultTags = ['def1', 'def2', 'def3'];

			const result = await target.notify({
				text: 'some text',
				time: new Date(12345).toISOString(),
			});

			expect(client.post).toHaveCallsLike([
				'api/annotations',
				{
					text: 'some text',
					tags: ['def1', 'def2', 'def3', 'app name', 'app version'],
					time: 12345,
					timeEnd: undefined,
				},
			]);
			expect(result).toBe('id result');
		});

		it('should send alert with custom tags concatenated, when they are informed', async () => {
			target['config'].defaultTags = ['def1', 'def2', 'def3'];

			const result = await target.notify({
				text: 'some text',
				time: new Date(12345).toISOString(),
				tags: ['tag1', 'tag2'],
			});

			expect(client.post).toHaveCallsLike([
				'api/annotations',
				{
					text: 'some text',
					tags: [
						'tag1',
						'tag2',
						'def1',
						'def2',
						'def3',
						'app name',
						'app version',
					],
					time: 12345,
					timeEnd: undefined,
				},
			]);
			expect(result).toBe('id result');
		});

		it('should send alert with timeEnd, when it is informed', async () => {
			const result = await target.notify({
				text: 'some text',
				timeEnd: new Date(12345).toISOString(),
			});

			expect(client.post).toHaveCallsLike([
				'api/annotations',
				{
					text: 'some text',
					tags: ['app name', 'app version'],
					time: now,
					timeEnd: 12345,
				},
			]);
			expect(result).toBe('id result');
		});
	});

	describe(GrafanaClient.prototype.updateNotification.name, () => {
		beforeEach(() => {
			client.put = jest.fn().mockResolvedValue({ id: 'id result' });
		});

		it('should send update request', async () => {
			const result = await target.updateNotification(
				123,
				'body' as unknown as GrafanaAlert,
			);

			expect(client.put).toHaveCallsLike(['api/annotations/123', 'body']);
			expect(result).toBeUndefined();
		});
	});

	describe(GrafanaClient.prototype.find.name, () => {
		const apiResult = [
			{
				id: 1,
				alertName: 'alert 1',
				time: 1,
				timeEnd: 2,
				created: 3,
				updated: 4,
			},
			{
				id: 2,
				alertName: 'alert 2',
				time: 5,
				timeEnd: 6,
				created: 7,
				updated: 8,
			},
		];
		const expectedResult = [
			{
				alertName: 'alert 1',
				id: 1,
				time: new Date(1).toISOString(),
				timeEnd: new Date(2).toISOString(),
				created: new Date(3).toISOString(),
				updated: new Date(4).toISOString(),
			},
			{
				alertName: 'alert 2',
				id: 2,
				time: new Date(5).toISOString(),
				timeEnd: new Date(6).toISOString(),
				created: new Date(7).toISOString(),
				updated: new Date(8).toISOString(),
			},
		];
		beforeEach(() => {
			client.get = jest.fn().mockResolvedValue(apiResult);
			target['config'].applicationName = 'app name';
			target['config'].applicationVersion = 'app version';
		});

		it('should query for the informed fields considering application name and version, when no default tags exist', async () => {
			const iterable = target.find({ text: '123' });
			const result = await iterable.toArray();

			expect(client.get).toHaveCallsLike([
				'api/annotations',
				{
					text: '123',
					tags: ['app name', 'app version'],
				},
			]);
			expect(result).toEqual(expectedResult);
		});

		it('should query for the informed fields considering default tags, application name and version', async () => {
			target['config'].defaultTags = ['def1', 'def2', 'def3'];
			const iterable = target.find({ text: '123' });
			const result = await iterable.toArray();

			expect(client.get).toHaveCallsLike([
				'api/annotations',
				{
					text: '123',
					tags: ['def1', 'def2', 'def3', 'app name', 'app version'],
				},
			]);
			expect(result).toEqual(expectedResult);
		});

		it('should query for the informed fields considering application name and version, when custom tags are informed', async () => {
			const iterable = target.find({ text: '123', tags: ['my tag'] });
			const result = await iterable.toArray();

			expect(client.get).toHaveCallsLike([
				'api/annotations',
				{
					text: '123',
					tags: ['my tag', 'app name', 'app version'],
				},
			]);
			expect(result).toEqual(expectedResult);
		});
	});

	describe(GrafanaClient.prototype.notifyNewVersion.name, () => {
		let find: jest.SpyInstance;
		const alert = {
			tags: ['startup'],
			text: 'Application started: app name@app version',
		};

		beforeEach(() => {
			find = jest
				.spyOn(target, 'find')
				.mockReturnValue(fluentAsync([] as GrafanaAlert[]));
			jest.spyOn(target, 'notify').mockResolvedValue(undefined as any);
			target['config'].applicationName = 'app name';
			target['config'].applicationVersion = 'app version';
		});

		it('should send notification when no notification exists', async () => {
			const result = target.notifyNewVersion();

			expect(result).toBeUndefined();
			expect(find).toHaveCallsLike();
			expect(target.notify).toHaveCallsLike();
			await delay(1);

			expect(find).toHaveCallsLike([alert]);
			expect(target.notify).toHaveCallsLike([alert]);
		});

		it('should not send notification when another notification exists', async () => {
			find.mockReturnValue(fluentAsync([1]));

			const result = target.notifyNewVersion();

			expect(result).toBeUndefined();
			expect(find).toHaveCallsLike();
			expect(target.notify).toHaveCallsLike();
			await delay(1);

			expect(find).toHaveCallsLike([alert]);
			expect(target.notify).toHaveCallsLike();
		});
	});
});
