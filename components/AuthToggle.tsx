"use client";

import * as React from "react";
import CustomSignIn from "./CustomSignIn";
import CustomSignUp from "./CustomSignUp";

export default function AuthToggle() {
  const [isSignUp, setIsSignUp] = React.useState(false);

  if (isSignUp) {
    return (
      <div className="relative">
        <CustomSignUp onToggle={() => setIsSignUp(false)} />
      </div>
    );
  }

  return (
    <div className="relative">
      <CustomSignIn onToggle={() => setIsSignUp(true)} />
    </div>
  );
}
