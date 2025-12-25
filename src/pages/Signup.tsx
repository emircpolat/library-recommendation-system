import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { validateEmail, validatePassword, validateRequired } from '@/utils/validation';
import { handleApiError } from '@/utils/errorHandling';

export function Signup() {
  const navigate = useNavigate();
  // Extract signup, verifyCode, and resendCode from AuthContext
  const { signup, verifyCode, resendCode } = useAuth();
  
  // State to track current step: 'signup' or 'verification'
  const [step, setStep] = useState<'signup' | 'verification'>('signup');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  
  const [errors, setErrors] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // State for resend code feedback message (stores message text and type: success/error)
  const [resendStatus, setResendStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const validate = (): boolean => {
    const newErrors: any = {};
    if (!validateRequired(name)) newErrors.name = 'Name is required';
    if (!validateRequired(email)) newErrors.email = 'Email is required';
    else if (!validateEmail(email)) newErrors.email = 'Invalid email format';
    
    if (!validateRequired(password)) newErrors.password = 'Password is required';
    else if (!validatePassword(password)) newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
    
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // STEP 1: SIGNUP SUBMISSION
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setResendStatus(null); // Clear any previous status
    try {
      await signup(email, password, name);
      // If successful, move to Verification Step
      setStep('verification');
    } catch (error: any) {
      // SPECIAL CASE: If user already exists but is unconfirmed
      if (error.name === 'UsernameExistsException' || error.message?.includes('already exists')) {
        setErrors({ email: 'User already exists. Please verify your email.' });
        
        // Directly move to verification step
        setStep('verification');
        
        // Try to automatically resend code
        try {
            await resendCode(email);
            setResendStatus({ 
              message: 'A new verification code has been sent to your email.', 
              type: 'success' 
            });
        } catch (resendErr) {
            // If auto-resend fails (due to spam limits), we don't show an error immediately,
            // we let the user try manually if they need to.
            console.log("Auto-resend skipped due to rate limit.");
        }
      } else {
        handleApiError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: CODE VERIFICATION
  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) {
      setErrors({ code: 'Verification code is required' });
      return;
    }

    setIsLoading(true);
    try {
      // Call the verification function from AuthContext
      await verifyCode(email, verificationCode);
      // If successful, redirect to login
      navigate('/login');
    } catch (error) {
      handleApiError(error);
      setErrors({ code: 'Invalid verification code' });
    } finally {
      setIsLoading(false);
    }
  };

  // FUNCTION: RESEND CODE MANUALLY
  const handleResendCode = async () => {
    setResendStatus(null); // Clear previous messages
    try {
        await resendCode(email);
        setResendStatus({ 
          message: 'New code sent successfully!', 
          type: 'success' 
        });
    } catch (error) {
        console.error(error);
        setResendStatus({ 
          message: 'Cannot send multiple emails in a short time. Please try again later.', 
          type: 'error' 
        });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 animated-bg">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
            <span className="gradient-text">
              {step === 'signup' ? 'Create Account' : 'Verify Email'}
            </span>
          </h1>
          <p className="text-slate-600 text-lg">
            {step === 'signup' 
              ? 'Join us to discover your next favorite book' 
              : `We sent a code to ${email}`}
          </p>
        </div>

        <div className="glass-effect rounded-3xl shadow-2xl border border-white/20 p-8">
          
          {/* STEP 1: SIGNUP FORM */}
          {step === 'signup' && (
            <form onSubmit={handleSignupSubmit}>
              <Input
                label="Full Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                required
                placeholder="John Doe"
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                required
                placeholder="you@example.com"
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                required
                placeholder="••••••••"
              />
              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                required
                placeholder="••••••••"
              />

              <div className="mb-6">
                 <label className="flex items-start cursor-pointer group">
                  <input
                    type="checkbox"
                    className="mt-1 mr-2 w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    required
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900">
                    I agree to the <Link to="/terms" className="text-violet-600 font-semibold">Terms</Link> and <Link to="/privacy" className="text-violet-600 font-semibold">Privacy Policy</Link>
                  </span>
                </label>
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </form>
          )}

          {/* STEP 2: VERIFICATION FORM */}
          {step === 'verification' && (
            <form onSubmit={handleVerificationSubmit}>
              <div className="mb-6">
                <Input
                  label="Verification Code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  error={errors.code}
                  required
                  placeholder="Enter 6-digit code"
                />
                
                {/* Feedback Message (Success or Error) */}
                {resendStatus && (
                    <p className={`text-sm mt-2 font-medium ${
                        resendStatus.type === 'success' ? 'text-green-600' : 'text-red-500'
                    }`}>
                        {resendStatus.message}
                    </p>
                )}
                
                <p className="text-sm text-slate-500 mt-2">
                  Didn't receive the code?{' '}
                  <button 
                    type="button" 
                    onClick={handleResendCode}
                    className="text-violet-600 hover:text-violet-700 font-semibold hover:underline"
                  >
                    Resend Code
                  </button>
                </p>
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Confirm Account'}
              </Button>

              <button 
                type="button"
                onClick={() => setStep('signup')}
                className="w-full mt-4 text-slate-600 hover:text-violet-600 text-sm font-semibold"
              >
                ← Back to Signup
              </button>
            </form>
          )}

          {step === 'signup' && (
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="text-violet-600 hover:text-violet-700 font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
