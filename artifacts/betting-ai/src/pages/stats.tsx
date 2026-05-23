import { useState } from "react";
import { useGetAiPerformance } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BrainCircuit, TrendingUp, Crosshair, Target, CheckCircle2, XCircle } from "lucide-react";
import type { GetAiPerformancePeriod } from "@workspace/api-client-react";
import aiBg from "@/assets/ai-bg.png";

export default function Stats() {
  const [period, setPeriod] = useState<GetAiPerformancePeriod>("30d");
  
  const { data: stats, isLoading } = useGetAiPerformance({ period });

  // Generate chart data based on recent results if available
  const chartData = stats?.recentResults?.reduce((acc, curr) => {
    const date = new Date(curr.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    const existing = acc.find(item => item.date === date);
    
    if (existing) {
      if (curr.correct) existing.won += 1;
      else existing.lost += 1;
      existing.total += 1;
      existing.winRate = Math.round((existing.won / existing.total) * 100);
    } else {
      acc.push({
        date,
        won: curr.correct ? 1 : 0,
        lost: curr.correct ? 0 : 1,
        total: 1,
        winRate: curr.correct ? 100 : 0
      });
    }
    return acc;
  }, [] as any[]).reverse() || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="relative rounded-xl overflow-hidden border border-border shadow-2xl">
        <div className="absolute inset-0 z-0">
          <img src={aiBg} alt="AI visualization" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        <div className="relative z-10 p-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Badge variant="outline" className="mb-4 bg-primary/10 text-primary border-primary/30 uppercase tracking-widest font-mono">
              Audit Algorithmique
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-white uppercase tracking-tight text-glow">
              Performance IA
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl text-lg">
              Transparence totale sur les résultats de notre modèle prédictif.
            </p>
          </div>
          
          <div className="bg-card/80 backdrop-blur-md border border-border p-2 rounded-lg w-full md:w-64 shrink-0">
            <Select value={period} onValueChange={(val) => setPeriod(val as GetAiPerformancePeriod)}>
              <SelectTrigger className="bg-transparent border-0 ring-offset-0 focus:ring-0">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
                <SelectItem value="90d">90 derniers jours</SelectItem>
                <SelectItem value="all">Depuis le début</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-2">
              <p className="text-sm font-medium text-muted-foreground uppercase">Win Rate</p>
              <Target className="h-4 w-4 text-primary" />
            </div>
            {isLoading ? <Skeleton className="h-10 w-24 mt-2" /> : (
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{(stats?.winRate || 0) * 100}%</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-2">
              <p className="text-sm font-medium text-muted-foreground uppercase">Prédictions</p>
              <BrainCircuit className="h-4 w-4 text-muted-foreground" />
            </div>
            {isLoading ? <Skeleton className="h-10 w-24 mt-2" /> : (
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{stats?.totalPredictions || 0}</span>
                <span className="text-sm text-muted-foreground">total</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-2">
              <p className="text-sm font-medium text-muted-foreground uppercase">Meilleur Marché</p>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            {isLoading ? <Skeleton className="h-10 w-full mt-2" /> : (
              <div className="mt-2">
                <span className="text-xl font-bold text-white truncate block">{stats?.bestMarket || '-'}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-2">
              <p className="text-sm font-medium text-muted-foreground uppercase">Confiance Moyenne</p>
              <Crosshair className="h-4 w-4 text-blue-500" />
            </div>
            {isLoading ? <Skeleton className="h-10 w-24 mt-2" /> : (
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">
                  {stats?.avgConfidence ? (stats.avgConfidence * 100).toFixed(1) : 0}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="uppercase">Évolution du Taux de Réussite</CardTitle>
            <CardDescription>Par jour sur la période sélectionnée</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : chartData.length > 0 ? (
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                    <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => [`${value}%`, 'Win Rate']}
                    />
                    <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.winRate >= 60 ? '#10b981' : entry.winRate >= 40 ? '#f59e0b' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground border border-dashed border-border rounded-lg">
                Données insuffisantes pour la période.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border flex flex-col">
          <CardHeader>
            <CardTitle className="uppercase">Derniers Résultats</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : stats?.recentResults && stats.recentResults.length > 0 ? (
              <div className="space-y-4 overflow-y-auto pr-2 max-h-[300px] custom-scrollbar">
                {stats.recentResults.slice(0, 10).map((res, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-secondary/30 border border-border">
                    <div className="flex-1 overflow-hidden pr-2">
                      <div className="text-sm font-bold text-white truncate">{res.market}</div>
                      <div className="text-xs text-muted-foreground truncate">{res.selection}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="outline" className="font-mono text-[10px] bg-background border-border">
                        {(res.confidence * 100).toFixed(0)}%
                      </Badge>
                      {res.correct ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
               <div className="h-full flex items-center justify-center text-muted-foreground">
                Aucun résultat récent.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
