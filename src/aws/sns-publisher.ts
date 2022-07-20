import { SNSManagementNotificationSettings } from './sns-management-notification-settings';
import { Publisher } from '../publisher';
import { PublishedNotification } from '../notification';

export class SNSPublisher implements Publisher {
	constructor(private config: SNSManagementNotificationSettings) {}

	async publish(notification: PublishedNotification) {
		const { SNS } = require('aws-sdk');
		const sns = new SNS({ region: this.config.snsRegion });
		await sns
			.publish({
				Message: JSON.stringify(notification),
				TopicArn: this.config.snsTopicArn,
			})
			.promise();
	}
}
