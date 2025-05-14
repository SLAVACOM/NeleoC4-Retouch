import { Prisma } from '@prisma/client'

export const returnUserInfoObject:Prisma.UserSelect = {
	id: true,
	createdAt: true,
	updatedAt: true,

	telegramId: true,
	telegramUsername: true,
	telegramFullName: true,
}