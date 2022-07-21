import {
	ManagementNotificationClient,
	SNSManagementNotificationClient,
} from '../../../src';
import * as SNSPublisherLib from '../../../src/aws/sns-publisher';

describe('SQSManagementNotificationClient', () => {
	const publisher = { info: 'SQSPublisher' } as any;

	beforeEach(() => {
		jest.spyOn(SNSPublisherLib, 'SNSPublisher').mockReturnValue(publisher);
		jest
			.spyOn(ManagementNotificationClient, 'create')
			.mockReturnValue('my client' as any);
	});

	it('should return an instance of ManagementNotificationClient with a SQS Publisher instance', () => {
		const result = SNSManagementNotificationClient.create('my config' as any);

		expect(SNSPublisherLib.SNSPublisher).toHaveCallsLike(['my config']);
		expect(ManagementNotificationClient.create).toHaveCallsLike([
			'my config',
			publisher,
		]);
		expect(result).toBe('my client');
	});
});
