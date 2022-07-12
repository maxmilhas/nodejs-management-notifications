export interface GrafanaAlert {
	alertName: string;
	dashboardId: number;
	panelId?: number;
	newState: string;
	prevState: string;
	created: string;
	updated: string;
	time: string;
	timeEnd: string;
	text: string;
	tags: string[];
	login: string;
	email: string;
	avatarUrl: string;
}
