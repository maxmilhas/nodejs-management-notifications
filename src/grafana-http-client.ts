import { GrafanaSettings } from './grafana-settings';
import { BaseHttpClient, Methods, Logger } from 'ts-base-http-client';

export class GrafanaHttpClient extends BaseHttpClient {
	private authorizationHeader: string;

	constructor(config: GrafanaSettings, logger: Logger) {
		super(config, logger);
		this.authorizationHeader = `Bearer ${config.apiKey}`;
	}
	override req(method: Methods, resource: string, contentType?: string) {
		return super
			.req(method, resource, contentType)
			.set('Authorization', this.authorizationHeader)
			.set('Accept', 'application/json');
	}
}
