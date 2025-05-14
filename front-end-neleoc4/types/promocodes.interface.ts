export interface IPromoCode {
	id: number;	
	createdAt: string;
	updatedAt: string;
	code: string;
	description?: string;
	discountSum: number;
	discountPercentage: number;
	generationCount: number;
	isActive: boolean;
	isAddGeneration: boolean;
	isDiscount: boolean;
	isMultiUse?: boolean;
	usesLeft: number;
	expirationDate?: string;
}

export interface GetPromoCodes {
	promos: IPromoCode[];
	productCount: number;
	pageCount: number;
} 