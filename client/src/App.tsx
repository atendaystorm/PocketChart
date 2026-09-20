import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider } from "@/context/auth-context";
import NotFound from "@/pages/not-found";

import Dashboard from "./pages/dashboard";
import TeamDetails from "./pages/team-details";
import Leagues from "./pages/leagues";
import Players from "./pages/players";
import PlayerDetails from "./pages/player-details";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard}/>
      <Route path="/teams/:id" component={TeamDetails}/>
      <Route path="/leagues" component={Leagues}/>
      <Route path="/players" component={Players}/>
      <Route path="/players/:id" component={PlayerDetails}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <SidebarProvider style={style}>
            <div className="flex h-screen w-full bg-background overflow-hidden">
              <AppSidebar />
              <div className="flex flex-col flex-1 h-full w-full overflow-hidden relative">
                <header className="flex md:hidden items-center p-4 border-b border-border bg-card z-20">
                  <SidebarTrigger />
                  <span className="ml-4 font-bold text-display tracking-wide text-xl uppercase">PocketRoster</span>
                </header>
                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
