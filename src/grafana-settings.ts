import { ApiConfig } from 'ts-base-http-client';

export interface GrafanaSettings extends ApiConfig {
	apiKey: string;
	defaultTags?: string[];
	applicationName?: string;
	applicationVersion?: string;
}
