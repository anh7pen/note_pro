import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import axios from 'axios';

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    session: { strategy: 'jwt' },
    callbacks: {
        async jwt({ token, user, account }) {
            if (account && user) {
                try {
                    console.log('Calling backend:', process.env.BACKEND_URL);
                    const res = await axios.post(
                        `${process.env.BACKEND_URL}/auth/google`,
                        {
                            name: user.name,
                            email: user.email,
                            avatar_url: user.image,
                        },
                        {
                            timeout: 30000, // 30 seconds timeout
                        }
                    );

                    token.token = res.data.token;
                } catch (error) {
                    console.error('Backend auth error:', error);
                    // Return token anyway to allow login, but without backend token
                    token.error = 'BackendAuthFailed';
                }
            }
            return token;
        },
        async session({ session, token }) {
            session.token = token.token;
            if (token.error) {
                session.error = token.error;
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },
    debug: true, // Enable debug mode
};
