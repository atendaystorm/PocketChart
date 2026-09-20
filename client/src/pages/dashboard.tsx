import { useTeams } from "@/hooks/use-teams";
import { Link } from "wouter";
import { Trophy, Plus, ShieldAlert, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TeamForm } from "@/components/forms/team-form";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

function AuthScreen() {
  const { login, isLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");

  // Login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setError("");
  };

  const switchMode = (next: "login" | "signup") => {
    setMode(next);
    resetForm();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await login(username, password);
    setSubmitting(false);
    if (!result.success) setError(result.message || "Invalid credentials");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    setSubmitting(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSubmitting(false);
      return setError(data.message || "Sign up failed.");
    }
    // auto-login after signup
    const result = await login(username, password);
    setSubmitting(false);
    if (!result.success) setError("Account created but login failed. Please sign in.");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-full bg-background">
      <div className="w-full max-w-sm mx-auto px-6 py-12">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <Trophy className="h-9 w-9 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-display tracking-wide">PocketRoster</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            {mode === "login" ? "Sign in to manage your teams" : "Create an account to get started"}
          </p>
        </div>

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username</Label>
                  <Input
                    id="login-username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter username"
                    autoComplete="username"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                  />
                </div>
                {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                <Button type="submit" className="w-full font-semibold" disabled={submitting}>
                  {submitting ? "Signing in…" : "Sign In"}
                </Button>
                <p className="text-center text-sm text-muted-foreground pt-1">
                  Don't have an account?{" "}
                  <button type="button" onClick={() => switchMode("signup")} className="text-primary font-semibold hover:underline">
                    Create one
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    autoComplete="username"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                  />
                </div>
                {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                <Button type="submit" className="w-full font-semibold" disabled={submitting}>
                  {submitting ? "Creating account…" : "Create Account"}
                </Button>
                <p className="text-center text-sm text-muted-foreground pt-1">
                  Already have an account?{" "}
                  <button type="button" onClick={() => switchMode("login")} className="text-primary font-semibold hover:underline">
                    Sign in
                  </button>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { isAdmin, isLoading: authLoading, username } = useAuth();
  const { data: teams, isLoading: teamsLoading } = useTeams({ enabled: isAdmin });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (authLoading || !isAdmin) {
    return <AuthScreen />;
  }

  const isLoading = teamsLoading;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-5xl font-bold text-display tracking-wide mb-2 text-foreground">
            Teams
          </h1>
          <p className="text-muted-foreground">
            {username ? `Welcome back, ${username}.` : "Manage your college football organizations and teams."}
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="hover-elevate gap-2 px-6">
              <Plus className="h-4 w-4" />
              <span className="font-semibold">Add New Team</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-display text-2xl tracking-wide">Register Team</DialogTitle>
            </DialogHeader>
            <TeamForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : teams?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-2xl border border-border border-dashed shadow-sm">
          <ShieldAlert className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-2xl font-bold text-display text-foreground mb-2">No Teams Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md">Start building your roster by adding your first team.</p>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Add Team
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams?.map((team) => {
            const winPercentage = team.wins + team.losses > 0
              ? (team.wins / (team.wins + team.losses)).toFixed(3).replace(/^0+/, '')
              : ".000";

            return (
              <Link key={team.id} href={`/teams/${team.id}`}>
                <Card className="group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 h-full flex flex-col">
                  <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
                          {team.conference}
                        </div>
                        <h2 className="text-2xl font-bold text-display leading-tight group-hover:text-primary transition-colors">
                          {team.name}
                        </h2>
                        <div className="text-muted-foreground font-medium flex items-center gap-1.5">
                          {team.mascot}
                        </div>
                        {(team as any).gameTitle && (
                          <div className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1">
                            <Gamepad2 className="h-3 w-3" />
                            {(team as any).gameTitle}
                          </div>
                        )}
                      </div>
                      {team.logoUrl ? (
                        <div className="h-14 w-14 rounded-full bg-white border shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                          <img src={team.logoUrl} alt={team.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                          <ShieldAlert className="h-7 w-7 opacity-50" />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 flex-1 flex flex-col justify-end">
                    <div className="grid grid-cols-3 gap-4 text-center divide-x divide-border/50 bg-secondary/50 rounded-lg p-3">
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Wins</div>
                        <div className="text-xl font-bold text-display text-foreground">{team.wins}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Loss</div>
                        <div className="text-xl font-bold text-display text-foreground">{team.losses}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Win %</div>
                        <div className="text-xl font-bold text-display text-foreground">{winPercentage}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
