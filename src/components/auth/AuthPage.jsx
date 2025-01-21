import React, { useState } from 'react';
import { SignInPage } from './SignInPage';
import { SignUpPage } from './SignUpPage';

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);

  return isSignUp ? (
    <SignUpPage onToggleAuth={() => setIsSignUp(false)} />
  ) : (
    <SignInPage onToggleAuth={() => setIsSignUp(true)} />
  );
}