import { PublishedNotification } from './notification';

export interface Publisher {
	publish(notification: PublishedNotification): Promise<void>;
}
