import { usePlayers } from "@/hooks/use-players";
import { Link } from "wouter";
import { UserPlus, Search, Shield, Shirt } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlayerForm } from "@/components/forms/player-form";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Players() {
  const { data: players, isLoading } = usePlayers();
  const { isAdmin } = useAuth();
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredPlayers = players?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.team?.name.toLowerCase().includes(search.toLowerCase()) ||
    p.position.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-5xl font-bold text-display tracking-wide mb-2 text-foreground">
            All Players
          </h1>
          <p className="text-muted-foreground">League-wide roster and individual player profiles.</p>
        </div>
        
        {isAdmin && (
          <Dialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen}>
            <DialogTrigger asChild>
              <Button className="hover-elevate gap-2 px-6">
                <UserPlus className="h-4 w-4" />
                <span className="font-semibold">Register Player</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-display text-2xl tracking-wide">Register Player</DialogTitle>
              </DialogHeader>
              <PlayerForm onSuccess={() => setIsAddPlayerOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search by name, team, or position..." 
          className="pl-10 h-12 rounded-xl bg-card border-border/60"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filteredPlayers && filteredPlayers.length > 0 ? (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold">Player</TableHead>
                <TableHead className="font-bold">Team</TableHead>
                <TableHead className="font-bold">Pos</TableHead>
                 <TableHead className="font-bold hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right font-bold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers.map((player) => (
                <TableRow key={player.id} className="group hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-secondary flex items-center justify-center font-bold text-display text-xl text-primary border shadow-sm">
                        {player.jerseyNumber}
                      </div>
                      <Link href={`/players/${player.id}`} className="font-semibold text-foreground hover:text-primary hover:underline underline-offset-4 transition-colors">
                        <span className="inline-flex items-center gap-1.5">
                          {player.name}
                          {player.isRedshirted && <Shirt className="h-4 w-4 text-red-600 fill-red-100" aria-label="Redshirted" />}
                        </span>
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    {player.team ? (
                      <Link href={`/teams/${player.team.id}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium">
                        {player.team.logoUrl ? (
                          <img src={player.team.logoUrl} className="h-6 w-6 object-contain" alt="" />
                        ) : (
                          <Shield className="h-5 w-5" />
                        )}
                        <span className="hidden sm:inline">{player.team.name}</span>
                        <span className="sm:hidden">{player.team.mascot}</span>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground italic">Free Agent</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-bold uppercase rounded-md bg-background">{player.position}</Badge>
                  </TableCell>
                   <TableCell className="text-muted-foreground hidden sm:table-cell">{player.status}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/players/${player.id}`}>
                      <Button variant="ghost" size="sm">
                        Profile
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-16 text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-foreground mb-1">No players found</h3>
            <p>Try adjusting your search or register a new player.</p>
          </div>
        )}
      </div>
    </div>
  );
}
