import { useState } from "react";
import { useGenerateCoupon, useGetTodayCoupons, useGetCouponHistory } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrainCircuit, Copy, Check, Zap, AlertTriangle, ShieldCheck, Flame, Loader2, History, Calendar, CalendarDays, CalendarRange } from "lucide-react";
import couponBg from "@/assets/coupon-bg.png";
import type { CouponLevel } from "@workspace/api-client-react/src/generated/api.schemas";

type Period = "today" | "weekend" | "week" | "month";

const PERIOD_OPTIONS: { value: Period; label: string; sublabel: string; icon: typeof Calendar }[] = [
  { value: "today", label: "Aujourd'hui", sublabel: "Matchs du jour", icon: Zap },
  { value: "weekend", label: "Ce Week-end", sublabel: "Sam. & Dim.", icon: Calendar },
  { value: "week", label: "Cette Semaine", sublabel: "7 prochains jours", icon: CalendarDays },
  { value: "month", label: "Ce Mois", sublabel: "30 prochains jours", icon: CalendarRange },
];

export default function Coupons() {
  const { data: todayCoupons, isLoading: isLoadingToday } = useGetTodayCoupons();
  const { data: historyCoupons, isLoading: isLoadingHistory } = useGetCouponHistory();
  const generateMutation = useGenerateCoupon();
  
  const [targetOdd, setTargetOdd] = useState<number>(5);
  const [period, setPeriod] = useState<Period>("today");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleGenerate = () => {
    generateMutation.mutate({
      data: {
        targetOdd,
        period,
      }
    });
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderCoupon = (coupon: any, title?: string) => {
    if (!coupon) return null;
    
    const levelConfig = {
      prudent: { icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/50" },
      standard: { icon: Zap, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/50" },
      risque: { icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/50" }
    };

    const config = levelConfig[coupon.level as keyof typeof levelConfig] || levelConfig.standard;
    const Icon = config.icon;

    return (
      <Card className={`bg-card border-border overflow-hidden relative shadow-lg ${coupon.level === 'standard' ? 'border-primary/50' : ''}`}>
        {coupon.level === 'standard' && (
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 uppercase tracking-widest rounded-bl-lg">
            Recommandé IA
          </div>
        )}
        <CardHeader className="pb-4 border-b border-border/50 bg-secondary/30">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg uppercase flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${config.bg}`}>
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                {title || coupon.level}
              </CardTitle>
              <CardDescription className="font-mono mt-1 text-muted-foreground text-xs">
                ID: {coupon.id} • Confiance moy: {coupon.confidenceAvg.toFixed(1)}%
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground uppercase font-mono">Cote Finale</div>
              <div className={`text-3xl font-bold font-mono ${config.color}`}>
                {coupon.actualOdd.toFixed(2)}
              </div>
            </div>
          </div>
          
          {coupon.warning && (
             <Alert variant="destructive" className="mt-4 bg-red-950/30 border-red-900/50">
               <AlertTriangle className="h-4 w-4" />
               <AlertDescription className="text-xs">{coupon.warning}</AlertDescription>
             </Alert>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {coupon.selections.map((sel: any, idx: number) => (
              <div key={idx} className="p-4 hover:bg-secondary/20 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-white text-sm">{sel.homeTeam} - {sel.awayTeam}</div>
                    {sel.kickoffAt && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(sel.kickoffAt).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="font-mono bg-background text-[10px] border-border shrink-0 ml-2">
                    {sel.confidence.toFixed(0)}% conf.
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="text-muted-foreground">
                    <span className="uppercase text-xs mr-2">{sel.marketLabel}</span>
                    <span className="text-white font-medium">{sel.selectionLabel}</span>
                  </div>
                  <div className="font-mono font-bold text-primary">{sel.oddValue.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-secondary/10 border-t border-border mt-auto">
             <Button 
                variant="outline" 
                className="w-full border-border bg-background hover:bg-secondary hover:text-white"
                onClick={() => copyToClipboard(
                  `Coupon BettingAI - Cote ${coupon.actualOdd.toFixed(2)}\n` + 
                  coupon.selections.map((s:any) => `${s.homeTeam}-${s.awayTeam}: ${s.selectionLabel} @ ${s.oddValue.toFixed(2)}`).join('\n'), 
                  coupon.id
                )}
             >
                {copiedId === coupon.id ? (
                  <><Check className="mr-2 h-4 w-4 text-green-500" /> Copié</>
                ) : (
                  <><Copy className="mr-2 h-4 w-4" /> Copier les sélections</>
                )}
             </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="relative rounded-xl overflow-hidden border border-border shadow-2xl h-48 md:h-64 flex items-center">
        <div className="absolute inset-0 z-0">
          <img src={couponBg} alt="Analyst room" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-card to-transparent" />
        </div>
        <div className="relative z-10 p-8 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-tight text-glow mb-2">
            Créateur de Coupons
          </h1>
          <p className="text-muted-foreground text-lg">
            Générez des combinés optimisés par l'IA selon votre objectif de rentabilité et votre tolérance au risque.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card className="bg-card border-border sticky top-24" data-testid="coupon-generator-panel">
            <CardHeader>
              <CardTitle className="uppercase flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                Générateur
              </CardTitle>
              <CardDescription>Configurez vos paramètres</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Period selector */}
              <div className="space-y-3">
                <Label className="text-sm font-bold uppercase text-muted-foreground">Période des matchs</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PERIOD_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = period === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        data-testid={`period-${opt.value}`}
                        onClick={() => setPeriod(opt.value)}
                        className={`flex flex-col items-start p-3 rounded-md border-2 transition-all text-left ${
                          isSelected
                            ? "border-primary bg-primary/10 text-white"
                            : "border-border bg-background text-muted-foreground hover:border-border/80 hover:bg-secondary/30"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-primary" : ""}`} />
                          <span className="text-xs font-bold uppercase tracking-wide">{opt.label}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">{opt.sublabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Odd selector */}
              <div className="space-y-4">
                <Label className="text-sm font-bold uppercase text-muted-foreground">Cote cible visée</Label>
                <RadioGroup
                  value={targetOdd.toString()}
                  onValueChange={(val) => setTargetOdd(Number(val))}
                  className="grid grid-cols-2 gap-3"
                  data-testid="odd-selector"
                >
                  {[2, 5, 10, 20, 50, 100].map(val => (
                    <div key={val}>
                      <RadioGroupItem value={val.toString()} id={`odd-${val}`} className="peer sr-only" />
                      <Label
                        htmlFor={`odd-${val}`}
                        data-testid={`odd-option-${val}`}
                        className="flex flex-col items-center justify-between rounded-md border-2 border-border bg-background p-4 hover:bg-secondary hover:text-white peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer font-mono text-lg transition-all"
                      >
                        x{val}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Button
                onClick={handleGenerate}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg uppercase tracking-wider font-bold"
                disabled={generateMutation.isPending}
                data-testid="button-generate-coupon"
              >
                {generateMutation.isPending ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Calcul en cours...</>
                ) : (
                  <><Zap className="mr-2 h-5 w-5" /> Générer Coupon</>
                )}
              </Button>
              
              {generateMutation.isError && (
                <Alert variant="destructive" className="bg-red-950 border-red-900">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Erreur</AlertTitle>
                  <AlertDescription>Impossible de générer le coupon. Veuillez réessayer.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-8">
          {generateMutation.isSuccess && generateMutation.data && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold uppercase text-white border-b border-border pb-2">
                Résultats — {PERIOD_OPTIONS.find(p => p.value === period)?.label} · Cote x{targetOdd}
              </h2>
              <Tabs defaultValue="standard" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-secondary mb-6">
                  <TabsTrigger value="prudent" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Prudent</TabsTrigger>
                  <TabsTrigger value="standard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Standard</TabsTrigger>
                  <TabsTrigger value="risque" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">Risqué</TabsTrigger>
                </TabsList>
                <TabsContent value="prudent" className="mt-0">
                  {renderCoupon(generateMutation.data.prudent)}
                </TabsContent>
                <TabsContent value="standard" className="mt-0">
                  {renderCoupon(generateMutation.data.standard)}
                </TabsContent>
                <TabsContent value="risque" className="mt-0">
                  {renderCoupon(generateMutation.data.risque)}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {!generateMutation.isSuccess && (
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-xl font-bold uppercase text-muted-foreground border-b border-border pb-2">
                  Coupons du Jour (Auto-générés)
                </h2>
                {isLoadingToday ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    <Skeleton className="h-96 w-full rounded-xl" />
                    <Skeleton className="h-96 w-full rounded-xl" />
                  </div>
                ) : todayCoupons && todayCoupons.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {todayCoupons.map((coupon) => (
                      <div key={coupon.id}>
                        {renderCoupon(coupon)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-muted-foreground bg-card rounded-xl border border-border border-dashed">
                    Aucun coupon disponible pour aujourd'hui.
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold uppercase text-muted-foreground border-b border-border pb-2 flex items-center gap-2">
                  <History className="h-5 w-5" /> Historique Récent
                </h2>
                {isLoadingHistory ? (
                   <Skeleton className="h-32 w-full rounded-xl" />
                ) : historyCoupons && historyCoupons.length > 0 ? (
                  <div className="space-y-4">
                    {historyCoupons.slice(0, 3).map((coupon) => (
                      <Card key={coupon.id} className="bg-card border-border/50">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={`uppercase text-[10px] ${coupon.status === 'won' ? 'text-green-500 border-green-500' : coupon.status === 'lost' ? 'text-red-500 border-red-500' : 'text-muted-foreground border-border'}`}>
                                {coupon.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{new Date(coupon.createdAt).toLocaleDateString('fr-FR')}</span>
                            </div>
                            <div className="text-sm font-bold text-white">Cote Totale: {coupon.actualOdd.toFixed(2)}</div>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            {coupon.selections.length} sélections
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground bg-card rounded-xl border border-border border-dashed">
                    Aucun historique de coupon trouvé.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
