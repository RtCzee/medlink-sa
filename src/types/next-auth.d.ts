import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "patient" | "doctor" | "hospital" | "pharmacy" | "admin";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "patient" | "doctor" | "hospital" | "pharmacy" | "admin";
  }
}
