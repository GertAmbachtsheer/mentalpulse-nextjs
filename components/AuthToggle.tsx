"use client";

import * as React from "react";
import CustomSignIn from "./CustomSignIn";
import CustomSignUp from "./CustomSignUp";

export default function AuthToggle() {
  const [isSignUp, setIsSignUp] = React.useState(false);

  if (isSignUp) {
    return (
      <div className="relative">
        <CustomSignUp />
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <button
              onClick={() => setIsSignUp(false)}
              className="text-primary hover:text-primary/80 font-semibold transition-colors underline-offset-4 hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <CustomSignIn />
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
        <p className="text-sm text-muted-foreground text-center">
          Don't have an account?{" "}
          <button
            onClick={() => setIsSignUp(true)}
            className="text-primary hover:text-primary/80 font-semibold transition-colors underline-offset-4 hover:underline"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}
