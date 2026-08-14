import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getAuthSecret } from "@/lib/auth-defaults";
import { authenticateOrRegister } from "@/lib/user-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username;
        const password = credentials?.password;

        if (typeof username !== "string" || typeof password !== "string") {
          return null;
        }

        return authenticateOrRegister(username, password);
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.name = token.name ?? session.user.name;
      }
      return session;
    },
  },
  trustHost: true,
  secret: getAuthSecret(),
});
