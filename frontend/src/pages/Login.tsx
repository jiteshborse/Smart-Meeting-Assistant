import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../components/ui/use-toast';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { setUser } = useAuthStore();
    const { toast } = useToast();
    const navigate = useNavigate();

    // Temporary mock login - will be replaced with Supabase in Step 1.4
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mock successful login
            setUser({
                id: '1',
                email: email,
                name: email.split('@')[0]
            });

            toast({
                title: 'Success',
                description: 'You have been logged in successfully.',
            });

            navigate('/');
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Invalid email or password.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="text-4xl mb-2">🎙️</div>
                    <CardTitle className="text-2xl">Smart Meeting Assistant</CardTitle>
                    <CardDescription>
                        Sign in to access your meetings and insights
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                        <p>Demo credentials: any email/password works</p>
                        <p className="text-xs mt-1">(Supabase auth coming in Step 1.4)</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}