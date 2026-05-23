import { useGetDashboardSummary, useGetTodaysMatches, useGetLeagues } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Trophy, Zap, Clock, ShieldAlert, ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: matches, isLoading: isLoadingMatches } = useGetTodaysMatches();
  const { data: leagues, isLoading: isLoadingLeagues } = useGetLeagues();

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white uppercase tracking-tight text-glow">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Aperçu en temps réel des opportunités de la journée.</p>
        </div>
        <Link href="/dashboard/matches">
          <Button variant="outline" className="border-primary text-primary hover:bg-primary/20">
            Tous les matchs <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Matchs Aujourd'hui</CardTitle>
            <Trophy className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-16" /> : (
              <>
                <div className="text-3xl font-bold text-white">{summary?.totalMatchesToday || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Top Ligue: <span className="text-primary font-mono">{summary?.topLeague || '-'}</span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Matchs en Direct</CardTitle>
            <Activity className="h-4 w-4 text-primary animate-pulse" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-16" /> : (
              <>
                <div className="text-3xl font-bold text-white">{summary?.liveMatchesCount || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sur {summary?.totalMatchesToday || 0} matchs prévus
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Value Bets</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-16" /> : (
              <>
                <div className="text-3xl font-bold text-yellow-500">{summary?.valueBetsCount || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Opportunités détectées
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Confiance Moyenne</CardTitle>
            <ShieldAlert className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-16" /> : (
              <>
                <div className="text-3xl font-bold text-white">
                  {summary?.avgConfidence ? summary.avgConfidence.toFixed(1) : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sur l'ensemble des prédictions
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white uppercase flex items-center gap-2">
              <TrendingUp className="text-primary" /> Value Bets Recommandés
            </h2>
          </div>
          
          <div className="space-y-3">
            {isLoadingMatches ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)
            ) : matches && matches.filter(m => m.isValueBet).length > 0 ? (
              matches.filter(m => m.isValueBet).slice(0, 5).map(match => (
                <Link key={match.id} href={`/dashboard/matches/${match.id}`}>
                  <Card className="bg-secondary/50 border-border hover:border-primary transition-all cursor-pointer">
                    <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex-1 flex flex-col w-full">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-[10px] font-mono border-primary text-primary">
                            {match.league}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(match.kickoffAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="font-bold text-white truncate text-lg">
                          {match.homeTeam} - {match.awayTeam}
                        </div>
                      </div>
                      <div className="flex items-center gap-6 w-full md:w-auto border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                        <div className="text-center md:text-right">
                          <p className="text-xs text-muted-foreground uppercase font-mono">Prédiction</p>
                          <p className="text-sm font-bold text-white">{match.topPrediction}</p>
                        </div>
                        <div className="text-center md:text-right">
                          <p className="text-xs text-muted-foreground uppercase font-mono">Cote</p>
                          <p className="text-lg font-bold text-yellow-500">{match.topOdd?.toFixed(2) || '-'}</p>
                        </div>
                        <div className="text-center md:text-right">
                          <p className="text-xs text-muted-foreground uppercase font-mono">Confiance</p>
                          <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-0">
                            {match.confidence.toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground bg-secondary/30 rounded-lg border border-border border-dashed">
                Aucun value bet détecté pour le moment.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white uppercase border-b border-border pb-2">Top Ligues</h2>
          <div className="space-y-2">
            {isLoadingLeagues ? (
              [1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)
            ) : leagues && leagues.length > 0 ? (
              leagues.slice(0, 5).map((league) => (
                <Link key={league.id} href={`/dashboard/matches?league=${encodeURIComponent(league.name)}`}>
                  <Card className="bg-card border-border hover:bg-secondary/50 cursor-pointer transition-colors">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground border border-border">
                          {league.country.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">{league.name}</p>
                          <p className="text-xs text-muted-foreground">{league.country}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-mono">
                        {league.matchCount}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Aucune donnée disponible.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
