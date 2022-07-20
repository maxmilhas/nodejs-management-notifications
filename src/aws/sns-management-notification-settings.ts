import { ManagementNotificationSettings } from '../management-notification-settings';

export interface SNSManagementNotificationSettings
	extends ManagementNotificationSettings {
	snsRegion: string;
	snsTopicArn: string;
}
