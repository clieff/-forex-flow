"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl
    });

    setLoading(false);

    if (result?.error) {
      toast.error("Connexion impossible", {
        description: "Verifier les identifiants puis recommencez.",
        icon: <Sparkles className="h-4 w-4 text-forex-danger" />
      });
      return;
    }

    toast.success("Session ouverte", {
      description: "Bienvenue dans votre cockpit ForexFlow Pro.",
      icon: <Sparkles className="h-4 w-4 animate-pulse text-forex-mint" />
    });
    router.push(callbackUrl as any);
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          placeholder="votre@email.com"
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          placeholder="Votre mot de passe"
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <Button className="w-full" size="lg" disabled={loading}>
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Entrer dans ForexFlow Pro"}
      </Button>
    </form>
  );
}
