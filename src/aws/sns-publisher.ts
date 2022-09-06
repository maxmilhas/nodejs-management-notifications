import { SNSManagementNotificationSettings } from './sns-management-notification-settings';
import { Publisher } from '../publisher';
import { PublishedNotification } from '../notification';
import { SNS as SNSClass } from 'aws-sdk';
import { packageInfo } from '../package-info';

export class SNSPublisher implements Publisher {
	constructor(private config: SNSManagementNotificationSettings) {}

	async publish(notification: PublishedNotification) {
		const { SNS } = require('aws-sdk');
		const sns: SNSClass = new SNS({ region: this.config.snsRegion });
		await sns
			.publish({
				Message: JSON.stringify(notification),
				TopicArn: this.config.snsTopicArn,
				MessageAttributes: {
					applicationName: {
						DataType: 'String',
						StringValue: this.config.applicationName || packageInfo.name,
					},
					applicationVersion: {
						DataType: 'String',
						StringValue: this.config.applicationVersion || packageInfo.version,
					},
					defaultTags: {
						DataType: 'String.Array',
						StringValue: JSON.stringify(this.config.defaultTags || []),
					},
					tags: {
						DataType: 'String.Array',
						StringValue: JSON.stringify(notification.tags || []),
					},
				},
			})
			.promise();
	}
}
