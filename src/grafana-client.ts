import { packageInfo } from './package-info';
import { GrafanaSettings } from './grafana-settings';
import { Logger } from 'ts-base-http-client';
import { GrafanaHttpClient } from './grafana-http-client';
import { GrafanaAlert } from './grafana-alert';
import { fluent, fluentAsync, identity } from '@codibre/fluent-iterable';
import { dontWait } from './dont-wait';

type DateFields = 'time' | 'timeEnd' | 'created' | 'updated';

const dateFields: Array<DateFields> = ['time', 'timeEnd', 'created', 'updated'];

interface RawGrafanaAlert {
	alertName: string;
	dashboardId: number;
	panelId?: number;
	newState: string;
	prevState: string;
	created: number;
	updated: number;
	time: number;
	timeEnd: number;
	text: string;
	tags: string[];
	login: string;
	email: string;
	avatarUrl: string;
}

function transformAlert(item: Partial<GrafanaAlert>): Partial<RawGrafanaAlert> {
	const dates = fluent(dateFields).toObject(identity, (x) => {
		const value = item[x];
		return value ? new Date(value).getTime() : undefined;
	}) as Record<DateFields, number>;

	return {
		...item,
		...dates,
	};
}

function transformRawAlert(item: RawGrafanaAlert): GrafanaAlert {
	const dates = fluent(dateFields).toObject(identity, (x) =>
		new Date(item[x]).toISOString(),
	) as Record<DateFields, string>;

	return {
		...item,
		...dates,
	};
}

export class GrafanaClient {
	private static instance: GrafanaClient | undefined;
	private client = new GrafanaHttpClient(this.config, this.logger);

	private constructor(
		private config: GrafanaSettings,
		private logger: Logger,
	) {}

	static create(
		config: GrafanaSettings &
			Partial<Pick<GrafanaSettings, 'applicationName' | 'applicationVersion'>>,
		logger: Logger,
	) {
		if (this.instance) {
			throw new Error('This client must be singleton!');
		}

		const applicationName = config.applicationName || packageInfo.name;
		const applicationVersion = config.applicationVersion || packageInfo.version;

		return (this.instance = new GrafanaClient(
			{
				...config,
				applicationName,
				applicationVersion,
			},
			logger,
		));
	}

	private getTags(alert: Partial<Pick<GrafanaAlert, 'tags'>>) {
		return fluent(alert.tags || [])
			.concat(this.config.defaultTags || [])
			.append(this.config.applicationName)
			.append(this.config.applicationVersion)
			.toArray();
	}

	async notify(
		alert: Partial<Exclude<GrafanaAlert, 'created' | 'updated'>> &
			Pick<GrafanaAlert, 'text'>,
	): Promise<number> {
		const tags = this.getTags(alert);
		const time = alert.time ? new Date(alert.time).getTime() : Date.now();
		const timeEnd = alert.timeEnd
			? new Date(alert.timeEnd).getTime()
			: undefined;
		const body = await this.client.post('api/annotations', {
			...alert,
			tags,
			time,
			timeEnd,
		});
		return body.id;
	}

	async updateNotification(
		id: number,
		alert: Partial<Exclude<GrafanaAlert, 'created' | 'updated'>>,
	): Promise<void> {
		await this.client.put(`api/annotations/${id}`, alert);
	}

	find(alert: Partial<GrafanaAlert>) {
		return fluentAsync(
			this.client.get(
				'api/annotations',
				Object.assign(transformAlert(alert), {
					tags: this.getTags(alert),
				}),
			) as Promise<RawGrafanaAlert[]>,
		).map(transformRawAlert);
	}

	notifyNewVersion() {
		dontWait(async () => {
			const alert = {
				tags: ['startup'],
				text: `Application started: ${this.config.applicationName}@${this.config.applicationVersion}`,
			};
			if (!(await this.find(alert).any())) {
				await this.notify(alert);
			}
		});
	}
}
