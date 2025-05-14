interface Vial {
	id: number;
	name: string;
	photoUrl: string;
	createdAt: string;
	updatedAt: string;
	isDelete: boolean;
	vialCollectionId?: number;
}

interface VialCollection {
	id: number;
	name: string;
	description: string;
	createdAt: string;
	updatedAt: string;
	Vials: Vial[];
}