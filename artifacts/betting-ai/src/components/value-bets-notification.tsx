import { useState, useEffect, useRef } from "react";
import { useGetTodaysMatches } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellRing, TrendingUp, Clock, ChevronRight, X } from "lucide-react";
import { Link } from "wouter";

export function ValueBetsNotification() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const prevIdsRef = useRef<Set<number>>(new Set());
  const isFirstFetchRef = useRef(true);

  const { data: matches, refetch } = useGetTodaysMatches();

  useEffect(() => {
    const timer = setInterval(() => {
      void refetch();
    }, 30_000);
    return () => clearInterval(timer);
  }, [refetch]);

  const valueBets = (matches ?? []).filter(
    (m) => m.isValueBet && !dismissed.has(m.id)
  );

  const newCount = valueBets.length;

  useEffect(() => {
    if (!matches) return;

    const currentIds = new Set(
      matches.filter((m) => m.isValueBet).map((m) => m.id)
    );

    if (isFirstFetchRef.current) {
      prevIdsRef.current = currentIds;
      isFirstFetchRef.current = false;
      return;
    }

    const newOnes = matches.filter(
      (m) => m.isValueBet && !prevIdsRef.current.has(m.id)
    );

    for (const match of newOnes) {
      toast({
        title: "Value Bet détecté",
        description: `${match.homeTeam} - ${match.awayTeam} · ${match.topPrediction} @ ${match.topOdd?.toFixed(2)} · Confiance ${match.confidence?.toFixed(0)}%`,
        duration: 7000,
      });
    }

    prevIdsRef.current = currentIds;
  }, [matches, toast]);

  const dismiss = (id: number) => {
    setDismissed((prev) => new Set([...prev, id]));
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative text-muted-foreground hover:text-white hover:bg-white/5 h-9 w-9"
        onClick={() => setOpen((o) => !o)}
        data-testid="button-value-bets-bell"
        aria-label="Alertes Value Bets"
      >
        {newCount > 0 ? (
          <BellRing className="h-5 w-5 text-primary animate-[wiggle_1s_ease-in-out_infinite]" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {newCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {newCount > 9 ? "9+" : newCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="absolute left-full top-0 ml-2 z-50 w-80 rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in slide-in-from-left-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-white uppercase tracking-wide">
                  Alertes Value Bets
                </span>
              </div>
              <div className="flex items-center gap-2">
                {newCount > 0 && (
                  <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                    {newCount} actif{newCount > 1 ? "s" : ""}
                  </Badge>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-white transition-colors"
                  data-testid="button-close-notifications"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto divide-y divide-border/50">
              {valueBets.length === 0 ? (
                <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>Aucun value bet actif</p>
                  <p className="text-xs mt-1 opacity-70">Mise à jour toutes les 30 secondes</p>
                </div>
              ) : (
                valueBets.map((match) => (
                  <div
                    key={match.id}
                    className="px-4 py-3 hover:bg-secondary/20 transition-colors group"
                    data-testid={`value-bet-item-${match.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">
                          {match.homeTeam} - {match.awayTeam}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                          {match.league}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] text-white/80 bg-secondary/50 px-2 py-0.5 rounded-full">
                            {match.topPrediction}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-primary">
                            @ {match.topOdd?.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(match.kickoffAt).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span
                            className={`text-[10px] font-medium ${
                              match.confidence >= 75
                                ? "text-green-400"
                                : match.confidence >= 60
                                ? "text-yellow-400"
                                : "text-orange-400"
                            }`}
                          >
                            {match.confidence?.toFixed(0)}% confiance
                          </span>
                          {match.status === "live" && (
                            <span className="text-[10px] text-red-400 font-bold animate-pulse">
                              EN DIRECT
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Link
                          href={`/dashboard/matches/${match.id}`}
                          onClick={() => setOpen(false)}
                        >
                          <button className="text-muted-foreground hover:text-primary transition-colors" data-testid={`link-match-detail-${match.id}`}>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => dismiss(match.id)}
                          className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                          data-testid={`button-dismiss-vb-${match.id}`}
                          title="Ignorer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border bg-secondary/10 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Surveillance en temps réel
              </span>
              <Link href="/dashboard/matches" onClick={() => setOpen(false)}>
                <button className="text-[11px] text-primary hover:text-primary/80 font-medium transition-colors" data-testid="link-view-all-matches">
                  Voir tous les matchs →
                </button>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
