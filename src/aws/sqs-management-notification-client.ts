import { SQSManagementNotificationSettings } from './sqs-management-notification-settings';
import { ManagementNotificationClient } from './../management-notification-client';
import { SQSPublisher } from './sqs-publisher';

export const SQSManagementNotificationClient = {
	create(config: SQSManagementNotificationSettings) {
		return ManagementNotificationClient.create(
			config,
			new SQSPublisher(config),
		);
	},
};
