import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Member Sign In | BCBA Prep by Bee the Behavior Bae",
  description:
    "Sign in to open the BCBA Prep study materials and mock exams on your account.",
};

export default function SignInLayout({ children }: { children: ReactNode }) {
  return children;
}
