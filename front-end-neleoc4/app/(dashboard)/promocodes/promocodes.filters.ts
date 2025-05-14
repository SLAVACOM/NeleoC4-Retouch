export enum SearchCriteria {
	Code = 'code',
	Id = 'id',
	ExpirationDateLess = 'expirationDateLess',
	ExpirationDateGreater = 'expirationDateGreater',
}

export enum SortKeys {
	Id = 'id',
	Code = 'code',
	isDiscount = 'isDiscount',
	DiscountSum = 'discountSum',
	DiscountPercentage = 'discountPercentage',
	ExpirationDate = 'expirationDate',
	IsActive = 'isActive',
}

export  enum Direction {
	Asc = 'asc',
	Desc = 'desc',
}
