import { Link, useLocation } from "wouter";
import { Users, Trophy, LayoutDashboard, LogIn, LogOut, Lock, Medal } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const allNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, authRequired: false },
  { title: "Leagues", url: "/leagues", icon: Medal, authRequired: true },
  { title: "All Players", url: "/players", icon: Users, authRequired: true },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { isAdmin, login, logout } = useAuth();
  const { toast } = useToast();
  const [loginOpen, setLoginOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await login(username, password);
    setIsSubmitting(false);
    if (result.success) {
      setLoginOpen(false);
      setUsername("");
      setPassword("");
      toast({ title: "Logged in", description: "You now have admin access." });
    } else {
      toast({ title: "Login failed", description: result.message, variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    await logout();
    toast({ title: "Logged out", description: "Editing is now disabled." });
  };

  return (
    <Sidebar variant="inset" className="border-r border-sidebar-border bg-[#1a1a1a]">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Trophy className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-display text-2xl leading-none text-white tracking-wider">Pocket</span>
            <span className="text-xs font-semibold uppercase tracking-widest text-white/60 leading-none">Roster</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold tracking-widest uppercase text-white/50 mb-2">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allNavItems.filter(item => !item.authRequired || isAdmin).map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={`
                        transition-all duration-200 
                        ${isActive 
                          ? "bg-sidebar-accent text-white font-semibold shadow-sm" 
                          : "text-white/70 hover:bg-sidebar-accent/50 hover:text-white"}
                      `}
                    >
                      <Link href={item.url} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white">
                        <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-white/70"}`} />
                        <span className="text-sm font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/10">
        {isAdmin ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-2 py-1">
              <Lock className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Admin Mode</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start gap-2 text-white/60 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Log Out</span>
            </Button>
          </div>
        ) : (
          <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-white/40 hover:text-white/70 hover:bg-white/10"
              >
                <LogIn className="h-4 w-4" />
                <span className="text-sm">Admin Login</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[360px]">
              <DialogHeader>
                <DialogTitle className="text-display text-xl tracking-wide">Admin Login</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleLogin} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="sidebar-username">Username</Label>
                  <Input
                    id="sidebar-username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter username"
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sidebar-password">Password</Label>
                  <Input
                    id="sidebar-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Logging in…" : "Login"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
