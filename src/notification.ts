export interface Notification {
	alertName?: string;
	time?: string;
	timeEnd?: string;
	text?: string;
	tags?: string[];
	email?: string;
}

export interface PublishedNotification extends Notification {
	id: string;
}
