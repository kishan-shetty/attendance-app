'use client';

import { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { useRouter } from 'next/navigation';

const SignUpForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return; // Stop here on sign-up error
    }

    // If sign-up is successful, create user in public.users
    if (signUpData.user) {
      const { error: userInsertError } = await supabase
        .from('users')
        .insert({
          id: signUpData.user.id, // Use the user ID from Supabase Auth
          email,
          role: 'employee', // Set the default role
        });

      if (userInsertError) {
        setError('Sign up successful, but failed to create user profile.  Please contact support.');
        console.error('Error creating user profile:', userInsertError);
        setLoading(false);
        return;
      }
      alert('Sign up successful! Please check your email to verify your account.');
      router.push('/login');

    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSignUp}>
      <h2>Sign Up</h2>
      <div>
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Signing up...' : 'Sign Up'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
};

export default SignUpForm;
