const SNS = jest.fn();
jest.mock('aws-sdk', () => ({ SNS }));
import { SNSManagementNotificationSettings } from './../../../src/aws/sns-management-notification-settings';
import { SNSPublisher } from '../../../src/aws/sns-publisher';

describe(SNSPublisher.name, () => {
	let target: SNSPublisher;
	let config: SNSManagementNotificationSettings;

	beforeEach(() => {
		config = {} as any;
		target = new SNSPublisher(config);
	});

	describe(SNSPublisher.prototype.publish.name, () => {
		let promise: jest.SpyInstance;
		let publish: jest.SpyInstance;

		beforeEach(() => {
			promise = jest.fn().mockResolvedValue('sns result');
			publish = jest.fn().mockReturnValue({ promise });
			SNS.mockReturnValue({ publish });
			config.snsRegion = 'sns region';
			config.snsTopicArn = 'sns topic arn';
		});

		it('should return an instance of ManagementNotificationClient with a SQS Publisher instance', async () => {
			const result = await target.publish({ info: 'my notification' } as any);

			expect(SNS).toHaveCallsLike([{ region: 'sns region' }]);
			expect(publish).toHaveCallsLike([
				{
					Message: '{"info":"my notification"}',
					TopicArn: 'sns topic arn',
				},
			]);
			expect(promise).toHaveCallsLike([]);
			expect(result).toBeUndefined();
		});
	});
});
