'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/auth.service';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (token) {
      authService
        .verifyEmail(token)
        .then(() => setStatus('success'))
        .catch(() => setStatus('error'));
    } else {
      setStatus('error');
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background gaming-grid">
      <div className="absolute inset-0 bg-gradient-radial from-primary-900/10 via-transparent to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-surface/80 backdrop-blur-xl border border-surface-lighter/50 rounded-2xl p-8 text-center">
          <div className="flex items-center gap-2 justify-center mb-8">
            <div className="w-9 h-9 rounded-lg bg-gradient-gaming flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold gradient-text">MultiGame</span>
          </div>

          {status === 'loading' && (
            <div className="py-8">
              <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Verifying Email</h2>
              <p className="text-gray-400">Please wait while we verify your email address...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
              <p className="text-gray-400 mb-6">
                Your email has been successfully verified. You can now sign in.
              </p>
              <Link href="/login">
                <Button>Continue to Sign In</Button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="py-8">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
              <p className="text-gray-400 mb-6">
                The verification link is invalid or has expired.
              </p>
              <Link href="/login">
                <Button variant="outline">Back to Sign In</Button>
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
