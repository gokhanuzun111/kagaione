import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";

import Landing from "./pages/landing";
import Scenarios from "./pages/scenarios";
import Game from "./pages/game";
import Pricing from "./pages/pricing";
import Settings from "./pages/settings";
import NotFound from "./pages/not-found";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  variables: {
    colorBackground: "#0a0a0a",
    colorPrimary: "#c9a84c",
    colorForeground: "#ffffff",
    colorMutedForeground: "#888888",
    colorNeutral: "#333333",
    colorInput: "#111111",
    colorInputForeground: "#ffffff",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem"
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#0f0f0f] rounded-xl w-[440px] max-w-full overflow-hidden border border-white/10",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white",
    headerSubtitle: "text-gray-400",
    formFieldLabel: "text-gray-300",
    footerActionLink: "text-[#c9a84c]",
    footerActionText: "text-gray-500",
    socialButtonsBlockButtonText: "text-white"
  }
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 ambient-gradient">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 ambient-gradient">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function HomeRedirect() {
  const [, setLocation] = useLocation();

  return (
    <>
      <Show when="signed-in">
        {() => {
          // React effectively doesn't like side effects in render, so we use useEffect
          useEffect(() => {
            setLocation("/scenarios");
          }, []);
          return null;
        }}
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

const queryClient = new QueryClient();

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          
          <Route path="/scenarios">
            <Show when="signed-in" fallback={<SignInPage />}>
              <Scenarios />
            </Show>
          </Route>
          
          <Route path="/game/:sessionId">
            {(params) => (
              <Show when="signed-in" fallback={<SignInPage />}>
                <Game sessionId={params.sessionId} />
              </Show>
            )}
          </Route>
          
          <Route path="/pricing">
            <Show when="signed-in" fallback={<SignInPage />}>
              <Pricing />
            </Show>
          </Route>
          
          <Route path="/settings">
            <Show when="signed-in" fallback={<SignInPage />}>
              <Settings />
            </Show>
          </Route>
          
          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}
