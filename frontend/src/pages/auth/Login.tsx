/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

import apiClient from "@/api/apiClient";
import { useAuthStore } from "@/stores/authStore";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const loginWithEmail = useAuthStore((s) => s.loginWithEmail);

  const navigate = useNavigate();
  const { toast } = useToast();

  const navigateBasedOnRole = (userType: string) => {
    const routes: Record<string, string> = {
      FIGHTER: "/dashboard/fighter",
      ADMIN: "/dashboard/admin",
      SPONSOR: "/dashboard/sponsor",
      DONOR: "/dashboard/donor",
      FAN: "/dashboard/fan",
    };

    navigate(routes[userType] ?? "/");
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter email and password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { token, user_type } = await loginWithEmail(email, password);

      if (token) {
        apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      toast({ title: "Success", description: "Logged in successfully!" });

      navigateBasedOnRole(user_type);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Login failed. Check console.";
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12">
        <Card className="p-8 max-w-sm w-full">
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <h1 className="text-2xl font-bold text-center">Login</h1>

            <div className="space-y-2 flex flex-col items-start">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2 flex flex-col items-start">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-6">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Register Here
            </Link>
          </p>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
