import { Link, useLocation } from "wouter";
import {
  Activity,
  BarChart2,
  CopyCheck,
  Home,
  Trophy,
  Menu,
  BrainCircuit,
  Wifi,
  WifiOff,
  LogIn,
  LogOut,
  UserCircle2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useHealthCheck } from "@workspace/api-client-react";
import { Show, useClerk, useUser } from "@clerk/react";
import { ValueBetsNotification } from "@/components/value-bets-notification";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { data: health, isError: isHealthError } = useHealthCheck();
  const { signOut } = useClerk();
  const { user } = useUser();

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const navigation = [
    { name: "Accueil", href: "/", icon: Home },
    { name: "Dashboard", href: "/dashboard", icon: Activity },
    { name: "Matchs du jour", href: "/dashboard/matches", icon: Trophy },
    { name: "Créateur de coupons", href: "/dashboard/coupons", icon: CopyCheck },
    { name: "Performance IA", href: "/stats", icon: BarChart2 },
  ];

  const NavLinks = () => (
    <>
      <div className="mb-8 px-4 flex items-center gap-3">
        <BrainCircuit className="h-8 w-8 text-primary" />
        <span className="text-xl font-bold tracking-tight text-white uppercase text-glow flex-1">BettingAI</span>
        <ValueBetsNotification />
      </div>
      <nav className="flex flex-col gap-2 flex-1 px-2">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.name} href={item.href} className="w-full">
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start ${isActive ? "bg-secondary text-primary" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
                onClick={() => setIsMobileOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Auth section at bottom */}
      <div className="mt-auto px-3 pt-3 pb-2 border-t border-border space-y-2">
        <Show when="signed-in">
          <div className="flex items-center gap-2 px-1 py-2">
            <UserCircle2 className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.firstName || user?.username || "Utilisateur"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-white hover:bg-white/5 text-sm"
            onClick={() => signOut({ redirectUrl: basePath || "/" })}
            data-testid="button-sign-out"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Se déconnecter
          </Button>
        </Show>
        <Show when="signed-out">
          <Link href="/sign-in">
            <Button
              variant="ghost"
              className="w-full justify-start text-primary hover:text-primary hover:bg-primary/10 text-sm font-medium"
              data-testid="button-sign-in"
            >
              <LogIn className="mr-3 h-4 w-4" />
              Se connecter
            </Button>
          </Link>
        </Show>

        <div className="flex items-center justify-between px-1 pt-1">
          <span className="text-[10px] text-muted-foreground">Système IA v2.4.1</span>
          <div className="flex items-center gap-1">
            {isHealthError ? (
              <WifiOff className="h-3 w-3 text-destructive" />
            ) : (
              <Wifi className="h-3 w-3 text-primary animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 border-r border-border bg-card z-10 py-6">
        <NavLinks />
      </aside>

      {/* Mobile Header & Sidebar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-background flex items-center px-4 z-20">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2 text-white">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-card border-r-border p-0 py-6 flex flex-col">
            <NavLinks />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 flex-1">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight text-white uppercase">BettingAI</span>
        </div>
        <ValueBetsNotification />
      </header>

      {/* Main Content */}
      <main className="flex-1 md:pl-64 pt-16 md:pt-0 min-h-screen">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
