import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

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
        const expectedUser = process.env.AUTH_USERNAME;
        const expectedPass = process.env.AUTH_PASSWORD;

        if (!expectedUser || !expectedPass) {
          throw new Error("Auth is not configured (AUTH_USERNAME / AUTH_PASSWORD)");
        }

        if (
          typeof username === "string" &&
          typeof password === "string" &&
          username === expectedUser &&
          password === expectedPass
        ) {
          return { id: "owner", name: username };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
});
