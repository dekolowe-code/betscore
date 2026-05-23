import { useState } from "react";
import { useGetTodaysMatches, useGetLeagues } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { Clock, Search, Zap, Activity, CalendarDays, CheckCircle2 } from "lucide-react";
import type { GetTodaysMatchesStatus } from "@workspace/api-client-react/src/generated/api.schemas";

export default function Matches() {
  const [searchTerm, setSearchTerm] = useState("");
  const [leagueFilter, setLeagueFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<GetTodaysMatchesStatus | "all">("all");

  const queryParams = {
    ...(leagueFilter !== "all" && { league: leagueFilter }),
    ...(statusFilter !== "all" && { status: statusFilter as GetTodaysMatchesStatus })
  };

  const { data: matches, isLoading: isLoadingMatches } = useGetTodaysMatches(queryParams);
  const { data: leagues, isLoading: isLoadingLeagues } = useGetLeagues();

  const filteredMatches = matches?.filter(match => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return match.homeTeam.toLowerCase().includes(term) || 
             match.awayTeam.toLowerCase().includes(term) ||
             match.league.toLowerCase().includes(term);
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white uppercase tracking-tight text-glow">Matchs du Jour</h1>
          <p className="text-muted-foreground mt-1">Analyse complète des rencontres avec prédictions de l'IA.</p>
        </div>
      </div>

      <div className="bg-card border border-border p-4 rounded-xl flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher une équipe..." 
            className="pl-9 bg-secondary/50 border-border font-mono text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={leagueFilter} onValueChange={setLeagueFilter}>
          <SelectTrigger className="w-full md:w-[200px] bg-secondary/50 border-border">
            <SelectValue placeholder="Toutes les ligues" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les ligues</SelectItem>
            {!isLoadingLeagues && leagues?.map(league => (
              <SelectItem key={league.id} value={league.name}>{league.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
          <SelectTrigger className="w-full md:w-[200px] bg-secondary/50 border-border">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="scheduled">À venir</SelectItem>
            <SelectItem value="live">En direct</SelectItem>
            <SelectItem value="finished">Terminés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {isLoadingMatches ? (
          [1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-28 w-full" />)
        ) : filteredMatches && filteredMatches.length > 0 ? (
          filteredMatches.map((match) => (
            <Link key={match.id} href={`/dashboard/matches/${match.id}`}>
              <Card className="bg-card border-border hover:border-primary transition-all cursor-pointer group">
                <CardContent className="p-0 flex flex-col sm:flex-row">
                  <div className="p-4 flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="text-[10px] font-mono border-border text-muted-foreground">
                        {match.league} • {match.country}
                      </Badge>
                      
                      <div className="flex items-center gap-2">
                        {match.isValueBet && (
                          <Badge className="bg-yellow-500/20 text-yellow-500 border-0 text-[10px]">
                            <Zap className="h-3 w-3 mr-1" /> VALUE
                          </Badge>
                        )}
                        {match.status === 'live' ? (
                          <Badge className="bg-primary/20 text-primary border-0 text-[10px] animate-pulse">
                            <Activity className="h-3 w-3 mr-1" /> LIVE
                          </Badge>
                        ) : match.status === 'scheduled' ? (
                          <Badge variant="secondary" className="text-[10px]">
                            <CalendarDays className="h-3 w-3 mr-1" /> PREVU
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> TERMINE
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-2">
                      <div className="text-base sm:text-lg font-bold text-white flex-1 text-right">{match.homeTeam}</div>
                      <div className="px-6 flex flex-col items-center justify-center shrink-0">
                        {match.status !== 'scheduled' ? (
                          <div className="text-xl font-bold font-mono tracking-widest text-primary">
                            {match.homeScore ?? '-'} : {match.awayScore ?? '-'}
                          </div>
                        ) : (
                          <div className="text-sm font-mono text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(match.kickoffAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                      <div className="text-base sm:text-lg font-bold text-white flex-1 text-left">{match.awayTeam}</div>
                    </div>
                  </div>

                  <div className="sm:w-64 bg-secondary/30 p-4 border-t sm:border-t-0 sm:border-l border-border flex flex-row sm:flex-col justify-between items-center group-hover:bg-secondary/50 transition-colors">
                    <div className="text-center w-full">
                      <div className="text-xs text-muted-foreground uppercase font-mono mb-1">Prédiction IA</div>
                      <div className="text-sm font-bold text-white truncate">{match.topPrediction}</div>
                    </div>
                    
                    <div className="w-px h-8 sm:w-full sm:h-px bg-border my-0 mx-4 sm:my-2 sm:mx-0" />
                    
                    <div className="flex items-center justify-between w-full">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground font-mono">Cote</div>
                        <div className="font-bold text-primary">{match.topOdd?.toFixed(2) || '-'}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground font-mono">Confiance</div>
                        <div className="font-bold text-white">{(match.confidence * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="p-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
            Aucun match ne correspond à vos critères.
          </div>
        )}
      </div>
    </div>
  );
}
