import { promisify } from 'util';
import { Notification } from '../../src/notification';
import { packageInfo } from '../../src/package-info';
import {
	ManagementNotificationClient,
	ManagementNotificationSettings,
	Publisher,
} from '../../src';

const delay = promisify(setTimeout);

describe(ManagementNotificationClient.name, () => {
	let target: ManagementNotificationClient;
	let client: Publisher;
	let config: ManagementNotificationSettings;

	beforeEach(() => {
		client = {} as Publisher;
		config = {} as ManagementNotificationSettings;
		target = ManagementNotificationClient.create(config, client);
	});

	afterEach(() => {
		delete ManagementNotificationClient['instance'];
	});

	it('should fill application name and version with package values when they are not informed', () => {
		expect(target['config'].applicationName).toBe(packageInfo.name);
		expect(target['config'].applicationVersion).toBe(packageInfo.version);
	});

	it('should keep informed name and version', () => {
		delete ManagementNotificationClient['instance'];
		const target2 = ManagementNotificationClient.create(
			{
				applicationName: 'name 1',
				applicationVersion: 'version 2',
			} as ManagementNotificationSettings,
			undefined as any,
		);

		expect(target2['config'].applicationName).toBe('name 1');
		expect(target2['config'].applicationVersion).toBe('version 2');
	});

	it('should throw an error when instances are created twice', () => {
		let error: any;

		try {
			ManagementNotificationClient.create(
				{
					applicationName: 'name 1',
					applicationVersion: 'version 2',
				} as ManagementNotificationSettings,
				undefined as any,
			);
		} catch (err) {
			error = err;
		}

		expect(error).toBeInstanceOf(Error);
	});

	describe(ManagementNotificationClient.prototype.notify.name, () => {
		beforeEach(() => {
			client.publish = jest.fn().mockResolvedValue({ id: 'id result' });
			target['config'].applicationName = 'app name';
			target['config'].applicationVersion = 'app version';
		});

		it('should send alert with only app name and app version and Date.now as time, when no defaultTags exists, no tags are informed and no time is informed', async () => {
			const result = await target.notify({
				text: 'some text',
			});

			expect(client.publish).toHaveCallsLike([
				{
					id: expect.any(String),
					text: 'some text',
					tags: ['app name', 'app version'],
				},
			]);
			expect(result).toEqual(expect.any(String));
		});

		it('should send alert with informed time, when time is informed', async () => {
			const result = await target.notify({
				text: 'some text',
				time: new Date(12345).toISOString(),
			});

			expect(client.publish).toHaveCallsLike([
				{
					id: expect.any(String),
					text: 'some text',
					tags: ['app name', 'app version'],
					time: new Date(12345).toISOString(),
				},
			]);
			expect(result).toEqual(expect.any(String));
		});

		it('should send alert with default tags concatenated, when they exist', async () => {
			target['config'].defaultTags = ['def1', 'def2', 'def3'];

			const result = await target.notify({
				text: 'some text',
				time: new Date(12345).toISOString(),
			});

			expect(client.publish).toHaveCallsLike([
				{
					id: expect.any(String),
					text: 'some text',
					tags: ['def1', 'def2', 'def3', 'app name', 'app version'],
					time: new Date(12345).toISOString(),
				},
			]);
			expect(result).toEqual(expect.any(String));
		});

		it('should send alert with custom tags concatenated, when they are informed', async () => {
			target['config'].defaultTags = ['def1', 'def2', 'def3'];

			const result = await target.notify({
				text: 'some text',
				time: new Date(12345).toISOString(),
				tags: ['tag1', 'tag2'],
			});

			expect(client.publish).toHaveCallsLike([
				{
					id: expect.any(String),
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
					time: new Date(12345).toISOString(),
				},
			]);
			expect(result).toEqual(expect.any(String));
		});

		it('should send alert with timeEnd, when it is informed', async () => {
			const result = await target.notify({
				text: 'some text',
				timeEnd: new Date(12345).toISOString(),
			});

			expect(client.publish).toHaveCallsLike([
				{
					id: expect.any(String),
					text: 'some text',
					tags: ['app name', 'app version'],
					timeEnd: new Date(12345).toISOString(),
				},
			]);
			expect(result).toEqual(expect.any(String));
		});
	});

	describe(
		ManagementNotificationClient.prototype.updateNotification.name,
		() => {
			beforeEach(() => {
				client.publish = jest.fn().mockResolvedValue({ id: 'id result' });
			});

			it('should send update request', async () => {
				const result = await target.updateNotification('123', {
					info: 'body',
				} as unknown as Notification);

				expect(client.publish).toHaveCallsLike([{ id: '123', info: 'body' }]);
				expect(result).toBeUndefined();
			});
		},
	);

	describe(ManagementNotificationClient.prototype.notifyNewVersion.name, () => {
		const alert = {
			tags: ['NewVersion'],
			text: 'New version online: app name@app version',
		};

		beforeEach(() => {
			jest.spyOn(target, 'notify').mockResolvedValue(undefined as any);
			target['config'].applicationName = 'app name';
			target['config'].applicationVersion = 'app version';
		});

		it('should send notification', async () => {
			const result = target.notifyNewVersion();

			expect(result).toBeUndefined();
			expect(target.notify).toHaveCallsLike();
			await delay(1);

			expect(target.notify).toHaveCallsLike([alert]);
		});
	});

	describe(ManagementNotificationClient.prototype.notifyChange.name, () => {
		const oldEntity = { info: 'old entity' };
		const newEntity = { info: 'new entity' };

		beforeEach(() => {
			jest.spyOn(target, 'notify').mockResolvedValue('new id');
		});

		it('should notify nothing when no change happened', async () => {
			const result = await target.notifyChange(
				undefined as any,
				oldEntity,
				oldEntity,
			);

			expect(target.notify).toHaveCallsLike();
			expect(result).toBeUndefined();
		});

		it('should notify when some change happened and no base text is informed', async () => {
			const result = await target.notifyChange(
				{ info: 'my notification' } as any,
				oldEntity,
				newEntity,
			);

			expect(target.notify).toHaveCallsLike([
				{
					info: 'my notification',
					text: ` {
-  info: \"old entity\"
+  info: \"new entity\"
 }
`,
				},
			]);
			expect(result).toBe('new id');
		});

		it('should notify when some change happened and some base text is informed', async () => {
			const result = await target.notifyChange(
				{ info: 'my notification', text: 'some change happened' } as any,
				oldEntity,
				newEntity,
			);

			expect(target.notify).toHaveCallsLike([
				{
					info: 'my notification',
					text: `some change happened

 {
-  info: \"old entity\"
+  info: \"new entity\"
 }
`,
				},
			]);
			expect(result).toBe('new id');
		});
	});
});
