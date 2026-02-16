import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useAuthStore } from '../stores/authStore';

import { Menu, LogOut } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

export default function Layout() {
    const { user, signOut } = useAuthStore();

    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu */}
                        <Sheet>
                            <SheetTrigger asChild className="md:hidden">
                                <Button variant="ghost" size="icon">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left">
                                <nav className="flex flex-col gap-4 mt-8">
                                    <Link to="/" className="text-lg font-medium">Dashboard</Link>
                                    <Link to="/meetings" className="text-lg font-medium">Meetings</Link>
                                    <Link to="/settings" className="text-lg font-medium">Settings</Link>
                                </nav>
                            </SheetContent>
                        </Sheet>

                        {/* Logo */}
                        <Link to="/" className="text-xl font-bold">
                            🎙️ Smart Meeting
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex gap-6 ml-6">
                            <Link to="/" className="text-sm font-medium hover:text-primary">
                                Dashboard
                            </Link>
                            <Link to="/meetings" className="text-sm font-medium hover:text-primary">
                                Meetings
                            </Link>
                            <Link to="/calendar" className="text-sm font-medium hover:text-primary">
                                Calendar
                            </Link>
                        </nav>
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-2">
                        {/* Theme toggle */}


                        {/* User menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>
                                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem className="text-sm">
                                    {user?.email}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="container mx-auto px-4 py-8">
                <Outlet />
            </main>
        </div>
    );
}