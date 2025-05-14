'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        username,
        password
      });
      console.log(result?.error);
      if (result?.ok) router.push('/');
      if (result?.error) setError(result.error);
    } catch (error: any) {
      setError(error);
    }
  };
  return (
    <div className="min-h-screen flex justify-center items-start md:items-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>This demo authentication.</CardDescription>
        </CardHeader>
        <CardFooter>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {error && <div className="text-red-500">{error}</div>}
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
              />
              <Button type="submit" className="w-full">
                Login
              </Button>
            </div>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
