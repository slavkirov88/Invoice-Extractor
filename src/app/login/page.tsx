"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, CheckCircle2 } from "lucide-react";
import { useLocale } from "@/lib/i18n/context";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [justRegistered, setJustRegistered] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLocale();

  const reset = () => {
    setError("");
    setMessage("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    reset();

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(t.auth.toastInvalidCredentials);
      setLoading(false);
    } else {
      router.push("/overview");
      router.refresh();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    reset();

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.auth.toastRegisterError);
      } else {
        setMessage(t.auth.toastAccountCreated);
        // Track registration conversion for Meta Pixel
        if (typeof window !== "undefined" && (window as any).fbq) {
          (window as any).fbq("track", "CompleteRegistration");
        }
        // Auto-switch to login tab after a short delay
        setTimeout(() => {
          setActiveTab("login");
          setJustRegistered(true);
          // Clear the glow after 4 seconds
          setTimeout(() => setJustRegistered(false), 4000);
        }, 1500);
      }
    } catch {
      setError(t.auth.toastServerError);
    }

    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError(t.auth.toastEnterEmail);
      return;
    }
    setLoading(true);
    reset();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage(t.auth.toastResetSent);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Receipt className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">TravelInvoices</CardTitle>
          <CardDescription>{t.auth.title}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); reset(); setJustRegistered(false); }}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger
                value="login"
                className={justRegistered ? "animate-glow-pulse ring-2 ring-emerald-500/60 bg-emerald-500/10 text-emerald-400" : ""}
              >
                {t.auth.loginTab}
              </TabsTrigger>
              <TabsTrigger value="register">{t.auth.registerTab}</TabsTrigger>
            </TabsList>

            {/* ── Вход ── */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t.auth.emailLabel}</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">{t.auth.passwordLabel}</Label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      {t.auth.forgotPassword}
                    </button>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                {message && <p className="text-sm text-emerald-500">{message}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t.common.loading : t.auth.loginButton}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <AnimatePresence mode="wait">
                {message ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-4 py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                    >
                      <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-lg font-medium text-emerald-500 text-center"
                    >
                      {message}
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="text-sm text-muted-foreground text-center"
                    >
                      {t.auth.toastNowLogin}
                    </motion.p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={handleSignUp}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">{t.auth.emailLabel}</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">{t.auth.passwordLabel}</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? t.common.loading : t.auth.registerButton}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
