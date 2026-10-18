import { AlertCircle } from "lucide-react";
import SignOutButton from "@/components/auth/sign-out-button";

// Shown when a signed-in user's profiles row is missing or can't be loaded.
export default function ProfileProblem({ status }: { status: "missing" | "error" }) {
  const missing = status === "missing";
  return (
    <div className="grid min-h-[100svh] place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/60 p-6 text-center">
        <span className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-full bg-rose-500/10 text-rose-500">
          <AlertCircle className="h-5 w-5" />
        </span>
        <h1 className="font-display text-xl font-semibold tracking-tight">
          {missing ? "Your profile isn't set up" : "We couldn't load your profile"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {missing
            ? "You're signed in, but we couldn't find your MedLink SA profile. Account setup may not have finished. Please contact MedLink SA support."
            : "Something went wrong while loading your account. Please refresh the page or try again in a few minutes."}
        </p>
        <div className="mt-6 flex justify-center">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
