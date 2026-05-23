import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Layout } from "@/components/layout";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Matches from "@/pages/matches";
import MatchDetail from "@/pages/match-detail";
import Coupons from "@/pages/coupons";
import Stats from "@/pages/stats";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#22c55e",
    colorForeground: "#d1d9e6",
    colorMutedForeground: "#8b96a9",
    colorDanger: "#ef4444",
    colorBackground: "#060c18",
    colorInput: "#0d1527",
    colorInputForeground: "#d1d9e6",
    colorNeutral: "#1e293b",
    fontFamily: "'Inter', 'JetBrains Mono', monospace",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#0a1628] rounded-xl w-[440px] max-w-full overflow-hidden border border-[#1e293b] shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white font-bold uppercase tracking-wider",
    headerSubtitle: "text-[#8b96a9]",
    socialButtonsBlockButtonText: "text-white",
    formFieldLabel: "text-[#8b96a9] text-sm uppercase tracking-wide",
    footerActionLink: "text-[#22c55e] hover:text-[#16a34a] font-medium",
    footerActionText: "text-[#8b96a9]",
    dividerText: "text-[#8b96a9]",
    identityPreviewEditButton: "text-[#22c55e]",
    formFieldSuccessText: "text-[#22c55e]",
    alertText: "text-white",
    logoBox: "flex justify-center mb-2",
    logoImage: "h-14 w-14",
    socialButtonsBlockButton: "border border-[#1e293b] bg-[#0d1527] hover:bg-[#1e293b] text-white",
    formButtonPrimary: "bg-[#22c55e] hover:bg-[#16a34a] text-[#060c18] font-bold uppercase tracking-wider",
    formFieldInput: "bg-[#0d1527] border-[#1e293b] text-white",
    footerAction: "border-t border-[#1e293b]",
    dividerLine: "bg-[#1e293b]",
    alert: "border-[#1e293b] bg-[#0d1527]",
    otpCodeFieldInput: "bg-[#0d1527] border-[#1e293b] text-white",
    formFieldRow: "",
    main: "",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function HomeRoute() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomeRoute} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
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

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Bienvenue sur BettingAI",
            subtitle: "Connectez-vous à votre compte",
          },
        },
        signUp: {
          start: {
            title: "Créer un compte",
            subtitle: "Accédez aux prédictions IA gratuitement",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <AppRoutes />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
