import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Layout } from "@/components/layout";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Matches from "@/pages/matches";
import MatchDetail from "@/pages/match-detail";
import Coupons from "@/pages/coupons";
import Stats from "@/pages/stats";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard">
        <Layout>
          <Dashboard />
        </Layout>
      </Route>
      <Route path="/dashboard/matches">
        <Layout>
          <Matches />
        </Layout>
      </Route>
      <Route path="/dashboard/matches/:id">
        <Layout>
          <MatchDetail />
        </Layout>
      </Route>
      <Route path="/dashboard/coupons">
        <Layout>
          <Coupons />
        </Layout>
      </Route>
      <Route path="/stats">
        <Layout>
          <Stats />
        </Layout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
