import { useGetMatch, useGetMatchAnalysis } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Clock, Activity, Target, AlertTriangle, Zap, CheckCircle2 } from "lucide-react";
import matchBg from "@/assets/match-bg.png";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function MatchDetail() {
  const params = useParams();
  const matchId = params.id ? parseInt(params.id) : 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: match, isLoading: isLoadingMatch } = useGetMatch(matchId, { query: { enabled: !!matchId } as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: analysis, isLoading: isLoadingAnalysis } = useGetMatchAnalysis(matchId, { query: { enabled: !!matchId } as any });

  if (isLoadingMatch || isLoadingAnalysis) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[250px] w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] md:col-span-2" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (!match) {
    return <div className="p-8 text-center text-white">Match introuvable.</div>;
  }

  // Get distinct markets from analysis
  const markets = [...new Set(analysis?.map(a => a.marketLabel || a.market) || [])];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <Link href="/dashboard/matches">
        <Button variant="ghost" className="text-muted-foreground hover:text-white -ml-4 mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour aux matchs
        </Button>
      </Link>

      {/* Match Header */}
      <div className="relative rounded-xl overflow-hidden border border-border shadow-2xl">
        <div className="absolute inset-0 z-0">
          <img src={matchBg} alt="Match" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
        </div>
        
        <div className="relative z-10 p-6 md:p-10">
          <div className="flex justify-between items-center mb-8">
            <Badge variant="outline" className="bg-background/50 backdrop-blur-sm border-border text-muted-foreground font-mono uppercase tracking-wider">
              {match.league} • {match.country}
            </Badge>
            
            {match.status === 'live' ? (
              <Badge className="bg-primary text-primary-foreground animate-pulse border-0">
                <Activity className="h-3 w-3 mr-2" /> EN DIRECT
              </Badge>
            ) : match.status === 'scheduled' ? (
              <Badge variant="secondary" className="border-border">
                <Clock className="h-3 w-3 mr-2" /> {new Date(match.kickoffAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-border text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 mr-2" /> TERMINÉ
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-center gap-4">
            <div className="flex-1">
              <h2 className="text-3xl md:text-5xl font-bold text-white uppercase tracking-tight">{match.homeTeam}</h2>
              <div className="mt-4 flex justify-center gap-1">
                {match.homeForm.split('').map((res, i) => (
                  <span key={i} className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${
                    res === 'W' ? 'bg-green-500/20 text-green-500' :
                    res === 'L' ? 'bg-red-500/20 text-red-500' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {res}
                  </span>
                ))}
              </div>
            </div>

            <div className="px-4 shrink-0">
              {match.status !== 'scheduled' ? (
                <div className="text-5xl md:text-7xl font-mono font-bold text-primary text-glow tracking-widest">
                  {match.homeScore ?? 0} <span className="text-muted-foreground/50">:</span> {match.awayScore ?? 0}
                </div>
              ) : (
                <div className="text-3xl font-mono text-muted-foreground font-light">VS</div>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-3xl md:text-5xl font-bold text-white uppercase tracking-tight">{match.awayTeam}</h2>
              <div className="mt-4 flex justify-center gap-1">
                {match.awayForm.split('').map((res, i) => (
                  <span key={i} className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${
                    res === 'W' ? 'bg-green-500/20 text-green-500' :
                    res === 'L' ? 'bg-red-500/20 text-red-500' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {res}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Analysis Column */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-primary h-5 w-5" />
            <h3 className="text-xl font-bold text-white uppercase">Analyses IA</h3>
          </div>

          {markets.map(marketLabel => {
            const predictions = analysis?.filter(a => (a.marketLabel || a.market) === marketLabel) || [];
            if (predictions.length === 0) return null;

            // Sort by confidence
            predictions.sort((a, b) => b.confidence - a.confidence);
            const topPred = predictions[0];

            return (
              <Card key={marketLabel} className="bg-card border-border overflow-hidden">
                <CardHeader className="bg-secondary/30 pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold uppercase">{marketLabel}</CardTitle>
                    {topPred.isValueBet && (
                      <Badge className="bg-yellow-500 text-yellow-950 font-bold border-0 hover:bg-yellow-400">
                        <Zap className="h-3 w-3 mr-1" /> VALUE BET
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="flex-1 w-full space-y-4">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-sm text-muted-foreground uppercase font-mono mb-1">Meilleur choix</p>
                            <p className="text-2xl font-bold text-white">{topPred.selectionLabel || topPred.selection}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground uppercase font-mono mb-1">Cote</p>
                            <p className="text-2xl font-bold text-primary font-mono">{topPred.oddValue.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Indice de confiance IA</span>
                            <span className="text-white font-mono font-bold">{(topPred.confidence * 100).toFixed(1)}%</span>
                          </div>
                          <Progress value={topPred.confidence * 100} className="h-2 bg-secondary [&>div]:bg-primary" />
                        </div>
                      </div>

                      <div className="w-full md:w-1/2 bg-background border border-border rounded-lg p-4 relative">
                        <AlertTriangle className="absolute top-4 right-4 h-4 w-4 text-muted-foreground/50" />
                        <h4 className="text-sm font-bold uppercase mb-2 text-white">Raisonnement IA</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {topPred.reasoning}
                        </p>
                      </div>
                    </div>

                    {predictions.length > 1 && (
                      <div className="mt-6 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground uppercase mb-3 font-mono">Alternatives</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {predictions.slice(1).map((alt, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-secondary/30 rounded p-2 text-sm border border-border">
                              <span className="text-white">{alt.selectionLabel || alt.selection}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-muted-foreground text-xs">{(alt.confidence * 100).toFixed(0)}%</span>
                                <span className="font-mono text-primary font-bold">{alt.oddValue.toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 border-b border-border bg-secondary/20">
              <CardTitle className="text-base uppercase flex items-center gap-2">
                 Comparateur de cotes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {match.odds && match.odds.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-xs">Bookmaker</TableHead>
                      <TableHead className="text-xs text-right">Cote</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {match.odds.filter(o => o.market === '1x2').slice(0, 5).map((odd, idx) => (
                      <TableRow key={idx} className="border-border hover:bg-secondary/50">
                        <TableCell className="font-medium text-white">{odd.bookmaker}</TableCell>
                        <TableCell className="text-right font-mono text-primary">{odd.oddValue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Cotes non disponibles pour ce match.
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-primary/20 to-card border-primary/30">
            <CardContent className="p-6">
              <h3 className="font-bold text-white uppercase mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> Verdict Terminal
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                L'algorithme BettingAI recommande de se concentrer sur les marchés de buts pour cette rencontre, la prédiction principale offrant la meilleure "Value".
              </p>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                Ajouter au coupon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
