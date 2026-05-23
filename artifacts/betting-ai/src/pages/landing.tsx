import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, BrainCircuit, Activity, Trophy, Zap, ChevronRight } from "lucide-react";
import heroImg from "@/assets/hero-stadium.png";
import aiBgImg from "@/assets/ai-bg.png";
import { useGetDashboardSummary, useGetTodayCoupons } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Landing() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: coupons, isLoading: isLoadingCoupons } = useGetTodayCoupons();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden border-b border-border">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImg} 
            alt="Stadium at night" 
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <Badge variant="outline" className="mb-6 border-primary/50 text-primary bg-primary/10 backdrop-blur-sm px-4 py-1.5 text-sm uppercase tracking-widest font-mono">
            Système d'Intelligence Artificielle V2
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-6 uppercase text-glow">
            Dominez <span className="text-primary">Le Jeu</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto font-light">
            L'assistant de paris sportifs le plus avancé. Des données pures, des prédictions précises, aucune émotion.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground">
                Accéder au Terminal <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/stats">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 border-border hover:bg-secondary">
                Voir les performances IA
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Live Stats Bar */}
      <section className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x divide-border">
            <div className="px-4">
              <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1 font-mono">Matchs Analysés</p>
              {isLoadingSummary ? <Skeleton className="h-8 w-20 mx-auto" /> : <p className="text-3xl font-bold text-white">{summary?.totalMatchesToday || 0}</p>}
            </div>
            <div className="px-4">
              <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1 font-mono">En Direct</p>
              {isLoadingSummary ? <Skeleton className="h-8 w-20 mx-auto" /> : <p className="text-3xl font-bold text-primary flex items-center justify-center gap-2"><span className="w-2 h-2 rounded-full bg-primary animate-pulse" />{summary?.liveMatchesCount || 0}</p>}
            </div>
            <div className="px-4">
              <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1 font-mono">Value Bets Détectés</p>
              {isLoadingSummary ? <Skeleton className="h-8 w-20 mx-auto" /> : <p className="text-3xl font-bold text-white">{summary?.valueBetsCount || 0}</p>}
            </div>
            <div className="px-4">
              <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1 font-mono">Confiance Moyenne</p>
              {isLoadingSummary ? <Skeleton className="h-8 w-20 mx-auto" /> : <p className="text-3xl font-bold text-white">{summary?.avgConfidence ? summary.avgConfidence.toFixed(1) : 0}%</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Features Teaser */}
      <section className="py-24 max-w-7xl mx-auto px-4 relative overflow-hidden">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 uppercase tracking-tight">Algorithmes de Pointe</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Notre intelligence artificielle analyse des milliers de points de données pour chaque match : forme des équipes, historiques des confrontations, blessures, météo et mouvements des cotes en temps réel.
            </p>
            <ul className="space-y-4">
              {[
                { icon: BrainCircuit, text: "Réseaux neuronaux entraînés sur 10+ ans de données" },
                { icon: Activity, text: "Détection de Value Bets en temps réel" },
                { icon: Zap, text: "Génération automatique de coupons optimisés" }
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-white p-4 bg-secondary/50 rounded-lg border border-border">
                  <div className="bg-primary/20 p-2 rounded-md">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-mono text-sm">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative h-[400px] rounded-xl overflow-hidden border border-border shadow-2xl">
            <img src={aiBgImg} alt="AI Neural Network" className="w-full h-full object-cover opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-tr from-background/90 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <Card className="bg-background/80 backdrop-blur-md border-primary/30">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white uppercase">Prédiction Premium</h3>
                    <Badge className="bg-primary text-primary-foreground">Confiance 87%</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Marché</span>
                      <span className="text-white font-mono">Plus de 2.5 Buts</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cote détectée</span>
                      <span className="text-primary font-mono font-bold">1.85</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full mt-4 overflow-hidden">
                      <div className="bg-primary h-full w-[87%]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Coupons */}
      <section className="py-24 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-white uppercase tracking-tight mb-2">Coupons du Jour</h2>
              <p className="text-muted-foreground">Sélections générées par l'IA pour maximiser la rentabilité.</p>
            </div>
            <Link href="/dashboard/coupons">
              <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">
                Générateur personnalisé <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {isLoadingCoupons ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
            </div>
          ) : coupons && coupons.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {coupons.slice(0, 3).map((coupon) => (
                <Card key={coupon.id} className="bg-background border-border hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <Badge variant="outline" className={`
                        ${coupon.level === 'prudent' ? 'border-blue-500 text-blue-500' : 
                          coupon.level === 'standard' ? 'border-green-500 text-green-500' : 
                          'border-orange-500 text-orange-500'} uppercase font-mono
                      `}>
                        {coupon.level}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground uppercase font-mono">Cote Totale</p>
                        <p className="text-2xl font-bold text-white">{coupon.actualOdd.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      {coupon.selections.slice(0, 3).map((sel, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm pb-3 border-b border-border/50 last:border-0 last:pb-0">
                          <span className="text-white line-clamp-1 flex-1 pr-2">{sel.homeTeam} vs {sel.awayTeam}</span>
                          <span className="text-primary font-mono shrink-0">{sel.oddValue.toFixed(2)}</span>
                        </div>
                      ))}
                      {coupon.selections.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center pt-2">
                          + {coupon.selections.length - 3} autres sélections
                        </div>
                      )}
                    </div>
                    
                    <Link href={`/dashboard/coupons`} className="w-full">
                      <Button className="w-full bg-secondary text-white hover:bg-primary hover:text-primary-foreground transition-colors">
                        Voir le détail
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
             <div className="text-center py-12 text-muted-foreground bg-background rounded-xl border border-border border-dashed">
                Aucun coupon généré pour le moment.
             </div>
          )}
        </div>
      </section>
    </div>
  );
}
