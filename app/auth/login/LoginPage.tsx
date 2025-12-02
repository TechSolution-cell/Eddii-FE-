'use client';

import { useState } from 'react';
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
    callbackUrl: string;
}

const LoginPage = ({ callbackUrl }: LoginPageProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    // const searchParams = useSearchParams();
    // const callbackUrl = searchParams.get("callbackUrl") ?? "/home";

    const validateForm = () => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const res = await signIn("credentials", {
                email,
                password,
                rememberMe,
                redirect: false,
                callbackUrl,
            })
            if (res?.error) {
                setErrors({ general: "Invalid credentials" });
                setIsLoading(false);
            }
            else router.replace(callbackUrl)
        } catch {
            setErrors({ general: 'Login failed. Please try again.' });
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card className="shadow-2xl border-slate-700 bg-white/95 backdrop-blur-sm">
                    <CardHeader className="text-center space-y-4 pb-6">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Phone className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold text-slate-800">Call Tracking</CardTitle>
                            <p className="text-slate-600 mt-2">Sign in to your account</p>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4" autoComplete='off'>
                            {/* Decoy (honeypot) fields: visually hidden but in DOM early */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value)
                                    }}
                                    className={`h-12 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                    disabled={isLoading}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={`h-12 pr-12 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                        disabled={isLoading}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={isLoading}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>

                            {errors.general && (
                                <div className="p-3 rounded-md bg-red-50 border border-red-200">
                                    <p className="text-sm text-red-600">{errors.general}</p>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        disabled={isLoading}
                                        checked={rememberMe}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setRememberMe(checked);
                                        }}

                                    />
                                    <span className="ml-2 text-sm text-slate-600">Remember me</span>
                                </label>
                                <button
                                    type="button"
                                    className="cursor-pointer text-sm text-blue-600 hover:text-blue-800"
                                    disabled={isLoading}
                                >
                                    Forgot password?
                                </button>
                            </div>

                            <Button
                                type="submit"
                                className="cursor-pointer w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg transition-all duration-200"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        Signing in...
                                    </div>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-slate-200 text-center">
                            <p className="text-sm text-slate-600">
                                {"Don't have an account?"}
                                <button className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                                    Contact your administrator
                                </button>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

    );
}

export default LoginPage;