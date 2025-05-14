export type TypeUsersDataFilter = {
	sort?: EnumUsersSort | string

	page: number;
	limit: number;
	search: string;
};


export enum EnumUsersSort {
	NEWEST = 'hight-createdAt',
	OLDEST = 'low-createdAt',

	ACTIVE = 'active-status',
	BLOCKED = 'blocked-status',

	AZ = 'az-name',
}