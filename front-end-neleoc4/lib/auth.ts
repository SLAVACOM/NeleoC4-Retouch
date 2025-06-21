import { jwtDecode } from 'jwt-decode';
import NextAuth from 'next-auth';
import { AdapterUser } from 'next-auth/adapters';
import CredentialsProvider from 'next-auth/providers/credentials';
import { IUser } from 'types/user.interface';

declare module 'next-auth' {
  interface User extends IUser {
    accessToken?: string;
    refreshToken?: string;
  }

  interface Session {
    accessToken?: string;
    refreshToken?: string;
    user?: (AdapterUser & IUser) | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    user?: IUser;
  }
}
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1234/';

export const authOptions = {
  trustHost: true
};

async function isAccessTokenExpired(accessToken?: string): Promise<boolean> {
  if (!accessToken) return true;

  try {
    const decoded: { exp: number } = jwtDecode(accessToken);
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Ошибка при декодировании токена:', error);
    return true;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      authorize: async (credentials) => {
        if (!credentials) return null;
        try {
          console.log(API_URL);
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              login: credentials.username,
              password: credentials.password
            })
          });

          if (!res.ok) throw new Error(res.status.toString());
          const data = await res.json();

          if (data?.accessToken && data?.refreshToken && data?.user) {
            const user: AdapterUser & IUser = {
              id: data.user.id.toString(),
              login: data.user.login,
              roles: data.user.roles,
              name: data.user.name,
              description: data.user.description,
              photoUrl: data.user.photoUrl,
              isDelete: data.user.isDelete,
              email: data.user.email ?? '',
              emailVerified: null,
              createdAt: data.user.createdAt,
              updatedAt: data.user.updatedAt
            };

            return {
              ...user,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken
            };
          }
        } catch (error) {
          console.error('Ошибка авторизации:', error);
        }
        return null;
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/login'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.user = user as IUser;
      }

      if (
        (await isAccessTokenExpired(token.accessToken)) &&
        token.refreshToken
      ) {
        console.log('Токен истек, пытаемся обновить');

        try {
          const response = await fetch(`${API_URL}/auth/login/access-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: token.refreshToken })
          });

          if (!response.ok) throw new Error('Ошибка обновления токена');

          const data = await response.json();
          token.accessToken = data.accessToken;
          token.refreshToken = data.refreshToken;
        } catch (error) {
          console.error('❌ Ошибка обновления токена, очищаем токены:', error);
          delete token.accessToken;
          delete token.refreshToken;
          delete token.user;
          token.error = 'RefreshAccessTokenError';
          signOut({ redirect: false });
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user = (token.user as AdapterUser & IUser) ?? null;
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url === '/unauthorized') return `${baseUrl}/login`;
      return url;
    }
  }
});
