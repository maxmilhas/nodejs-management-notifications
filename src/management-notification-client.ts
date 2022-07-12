import { v4 } from 'uuid';
import { packageInfo } from './package-info';
import { ManagementNotificationSettings } from './management-notification-settings';
import { Notification } from './notification';
import { fluent } from '@codibre/fluent-iterable';
import { dontWait } from './dont-wait';
import { Publisher } from './publisher';

export class ManagementNotificationClient {
	private static instance: ManagementNotificationClient | undefined;

	private constructor(
		private config: ManagementNotificationSettings &
			Required<
				Pick<
					ManagementNotificationSettings,
					'applicationName' | 'applicationVersion'
				>
			>,
		private publisher: Publisher,
	) {}

	static create(
		config: ManagementNotificationSettings &
			Partial<
				Pick<
					ManagementNotificationSettings,
					'applicationName' | 'applicationVersion'
				>
			>,
		publisher: Publisher,
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

	async updateNotification(
		id: string,
		alert: Partial<Exclude<Notification, 'created' | 'updated'>>,
	): Promise<void> {
		await this.publisher.publish({
			...alert,
			id,
		});
	}

	notifyNewVersion() {
		dontWait(async () => {
			const alert = {
				tags: ['NewVersion'],
				text: `New version online: ${this.config.applicationName}@${this.config.applicationVersion}`,
			};
			await this.notify(alert);
		});
	}
}
