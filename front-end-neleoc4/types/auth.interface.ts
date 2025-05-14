import { IUser } from './user.interface'

export interface IAuth {
	accessToken: string
	refreshToken: string
	user: IUser
}
