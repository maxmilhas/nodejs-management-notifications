import { ManagementNotificationSettings } from './../management-notification-settings';

export interface SQSManagementNotificationSettings
	extends ManagementNotificationSettings {
	snsRegion: string;
	snsTopicArn: string;
}
