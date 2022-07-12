import { BaseHttpClient, Logger, Methods } from 'ts-base-http-client';
import { GrafanaHttpClient } from './../../src/grafana-http-client';
import { SuperAgentRequest } from 'superagent';
import { GrafanaSettings } from '../../src';

describe(GrafanaHttpClient.name, () => {
	let req: SuperAgentRequest;
	let target: GrafanaHttpClient;
	let config: GrafanaSettings;

	beforeEach(() => {
		config = {
			url: 'my url',
			apiKey: 'token',
		} as GrafanaSettings;
		target = new GrafanaHttpClient(config, 'logger value' as unknown as Logger);
	});

	it('should set Authorization header properly', () => {
		expect(target['authorizationHeader']).toBe('Bearer token');
		expect(target).toBeInstanceOf(BaseHttpClient);
	});

	describe(GrafanaHttpClient.prototype.req.name, () => {
		beforeEach(() => {
			req = {
				set: jest.fn().mockReturnThis() as any,
			} as SuperAgentRequest;
			jest.spyOn(BaseHttpClient.prototype, 'req').mockReturnValue(req);
		});

		it('should pass Authorization and Accept headers for every request', () => {
			const result = target.req(
				'My Method' as unknown as Methods,
				'my resource',
				'my content type',
			);

			expect(req.set).toHaveCallsLike(
				['Authorization', 'Bearer token'],
				['Accept', 'application/json'],
			);
			expect(result).toBe(req);
		});
	});
});
