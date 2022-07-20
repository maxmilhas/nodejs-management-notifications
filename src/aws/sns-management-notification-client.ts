import { SNSManagementNotificationSettings } from './sns-management-notification-settings';
import { ManagementNotificationClient } from '../management-notification-client';
import { SNSPublisher } from './sns-publisher';

export const SNSManagementNotificationClient = {
	create(config: SNSManagementNotificationSettings) {
		return ManagementNotificationClient.create(
			config,
			new SNSPublisher(config),
		);
	},
};
