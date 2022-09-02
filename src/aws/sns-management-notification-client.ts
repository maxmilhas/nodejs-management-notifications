import Redis from 'ioredis';
import { SNSManagementNotificationSettings } from './sns-management-notification-settings';
import { ManagementNotificationClient } from '../management-notification-client';
import { SNSPublisher } from './sns-publisher';

export const SNSManagementNotificationClient = {
	create(config: SNSManagementNotificationSettings, redis?: Redis) {
		return ManagementNotificationClient.create(
			config,
			new SNSPublisher(config),
			redis,
		);
	},
};
