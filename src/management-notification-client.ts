import { v4 } from 'uuid';
import { packageInfo } from './package-info';
import { ManagementNotificationSettings } from './management-notification-settings';
import { Notification } from './notification';
import { fluent } from '@codibre/fluent-iterable';
import { dontWait } from './dont-wait';
import { Publisher } from './publisher';
import { diffString } from 'json-diff';
import Redis from 'ioredis';
import { RememberedRedis } from '@remembered/redis';

export class ManagementNotificationClient {
	private static instance: ManagementNotificationClient | undefined;
	private remembered: RememberedRedis | undefined;

	private constructor(
		private config: ManagementNotificationSettings &
			Required<
				Pick<
					ManagementNotificationSettings,
					'applicationName' | 'applicationVersion'
				>
			>,
		private publisher: Publisher,
		private redis: Redis | undefined,
	) {
		if (redis) {
			this.remembered = new RememberedRedis(
				{
					ttl: 0,
					redisTtl: 1,
				},
				redis,
			);
			this.notifyNewVersionAsync = this.remembered.wrap(
				this.notifyNewVersionAsync.bind(this),
				() => this.config.applicationName,
			);
		}
	}

	static create(
		config: ManagementNotificationSettings &
			Partial<
				Pick<
					ManagementNotificationSettings,
					'applicationName' | 'applicationVersion'
				>
			>,
		publisher: Publisher,
		redis?: Redis,
	) {
		if (this.instance) {
			throw new Error('This client must be singleton!');
		}

		const applicationName = config.applicationName || packageInfo.name;
		const applicationVersion = config.applicationVersion || packageInfo.version;

		return (this.instance = new ManagementNotificationClient(
			{
				...config,
				applicationName,
				applicationVersion,
			},
			publisher,
			redis,
		));
	}

	private getTags(alert: Partial<Pick<Notification, 'tags'>>) {
		return fluent(alert.tags || [])
			.concat(this.config.defaultTags || [])
			.append(this.config.applicationName)
			.append(this.config.applicationVersion)
			.toArray();
	}

	async notify(alert: Notification): Promise<string> {
		const tags = this.getTags(alert);
		const id = v4();

		await this.publisher.publish({
			...alert,
			tags,
			id,
		});

		return id;
	}

	async notifyChange<T>(
		alert: Notification,
		oldEntity: T,
		newEntity: T,
	): Promise<string | undefined> {
		const diff = diffString(oldEntity, newEntity, { color: false });
		if (diff) {
			const text = alert.text ? `${alert.text}\n\n${diff}` : diff;

			return this.notify({
				...alert,
				text,
			});
		}
	}

	async updateNotification(
		id: string,
		alert: Partial<Exclude<Notification, 'created' | 'updated'>>,
	): Promise<void> {
		await this.publisher.publish({
			...alert,
			id,
		});
	}

	async notifyNewVersionAsync() {
		const versionKey = `version:${this.config.applicationName}`;
		if (
			!this.redis ||
			(await this.redis.get(versionKey)) !== this.config.applicationVersion
		) {
			const alert = {
				tags: ['NewVersion'],
				text: `New version online: ${this.config.applicationName}@${this.config.applicationVersion}`,
			};
			await this.notify(alert);
			await this.redis?.setex(versionKey, 0, this.config.applicationVersion);
		}
	}

	notifyNewVersion() {
		dontWait(this.notifyNewVersionAsync.bind(this));
	}
}
