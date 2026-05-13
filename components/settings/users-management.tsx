"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, LoaderCircle, Shield, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type UserDto = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT";
  isActive: boolean;
  createdAt: Date;
};

export function UsersManagement({ initialUsers, currentUserId }: { initialUsers: UserDto[]; currentUserId: string }) {
  const [users, setUsers] = useState<UserDto[]>(initialUsers);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "AGENT" as "ADMIN" | "AGENT"
  });

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error("Erreur", { description: error.error || "Impossible de créer l'utilisateur." });
        return;
      }

      const newUser = await res.json();
      setUsers([newUser, ...users]);
      setIsAdding(false);
      setFormData({ name: "", email: "", password: "", role: "AGENT" });
      toast.success("Utilisateur créé", { description: "Le compte a été créé avec succès." });
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleStatus(userId: string, currentStatus: boolean) {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (!res.ok) throw new Error("Erreur");

      setUsers(users.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
      toast.success(`Utilisateur ${!currentStatus ? "activé" : "désactivé"}`);
      router.refresh();
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "secondary" : "default"}>
          <UserPlus className="h-4 w-4 mr-2" />
          {isAdding ? "Annuler" : "Nouvel agent"}
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddUser} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Nom complet</Label>
              <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Mot de passe temporaire</Label>
              <Input type="password" required minLength={6} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Rôle</Label>
              <select
                className="flex h-12 w-full rounded-2xl border border-forex-border bg-white/5 px-4 text-sm text-forex-text outline-none"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value as "ADMIN" | "AGENT" })}
              >
                <option value="AGENT">Agent (Transactions uniquement)</option>
                <option value="ADMIN">Administrateur (Accès complet)</option>
              </select>
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? <LoaderCircle className="h-4 w-4 mr-2 animate-spin" /> : null}
            Créer le compte
          </Button>
        </form>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <p className="font-semibold text-white">{user.name}</p>
                <p className="text-sm text-forex-muted">{user.email}</p>
              </TableCell>
              <TableCell>
                {user.role === "ADMIN" ? (
                  <Badge className="border-forex-mint/20 bg-forex-mint/10 text-forex-mint">
                    <Shield className="h-3 w-3 mr-1 inline" /> Admin
                  </Badge>
                ) : (
                  <Badge className="border-white/10 bg-white/[0.05] text-forex-muted">
                    Agent
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {user.isActive ? (
                  <Badge className="border-forex-mint/20 bg-forex-mint/10 text-forex-mint">Actif</Badge>
                ) : (
                  <Badge className="border-forex-danger/20 bg-forex-danger/10 text-forex-danger">Inactif</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                {user.id !== currentUserId && (
                  <button
                    onClick={() => toggleStatus(user.id, user.isActive)}
                    className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1 text-xs transition ${
                      user.isActive
                        ? "border-forex-danger/20 bg-forex-danger/5 text-forex-danger hover:bg-forex-danger/10"
                        : "border-forex-mint/20 bg-forex-mint/5 text-forex-mint hover:bg-forex-mint/10"
                    }`}
                  >
                    {user.isActive ? <XCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                    {user.isActive ? "Désactiver" : "Activer"}
                  </button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
