"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserPlus, Trash2, Shield, User, ShieldAlert } from "lucide-react";

interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function TeamPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "HR" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async () => {
    setError("");
    setSuccess("");

    if (!form.name || !form.email || !form.password) {
      setError("All fields are required");
      return;
    }

    if (form.password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (res.ok) {
      setDialogOpen(false);
      setForm({ name: "", email: "", password: "", role: "HR" });
      setSuccess(`${data.name} has been added to the team!`);
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(data.error || "Failed to create user");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the team?`)) return;

    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });

    if (res.ok) {
      fetchUsers();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete user");
    }
  };

  // Only admins can manage team
  if (user?.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <ShieldAlert className="w-12 h-12 text-red-400/30 mb-4" />
        <h2 className="text-xl font-bold text-white/60">Admin Access Required</h2>
        <p className="text-white/30 mt-2">Only admins can manage team members.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Team</h1>
          <p className="text-white/40 mt-1">
            Manage HR team members who can access the platform
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#12121a] border-white/10 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-white/70">Full Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="e.g. Priya Sharma"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="priya@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Password</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Set a password"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Role</Label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="HR" className="bg-[#12121a]">HR</option>
                  <option value="ADMIN" className="bg-[#12121a]">Admin</option>
                </select>
              </div>
              <Button
                onClick={handleCreate}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white"
              >
                Add to Team
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Success message */}
      {success && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          ✅ {success}
        </div>
      )}

      {/* Users table */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white/40 font-medium">Name</TableHead>
                <TableHead className="text-white/40 font-medium hidden sm:table-cell">Email</TableHead>
                <TableHead className="text-white/40 font-medium">Role</TableHead>
                <TableHead className="text-white/40 font-medium hidden md:table-cell">Joined</TableHead>
                <TableHead className="text-white/40 font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow
                  key={u.id}
                  className="border-white/5 hover:bg-white/[0.03] transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0 ${
                          u.role === "ADMIN"
                            ? "bg-gradient-to-br from-amber-500 to-orange-600"
                            : "bg-gradient-to-br from-indigo-500 to-purple-600"
                        }`}
                      >
                        {u.name?.[0] || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">{u.name}</p>
                        <p className="text-xs text-white/30 sm:hidden">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-white/50 text-sm hidden sm:table-cell">
                    {u.email}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border ${
                        u.role === "ADMIN"
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                          : "bg-indigo-500/15 text-indigo-400 border-indigo-500/20"
                      }`}
                    >
                      {u.role === "ADMIN" ? (
                        <Shield className="w-3 h-3" />
                      ) : (
                        <User className="w-3 h-3" />
                      )}
                      {u.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-white/40 text-sm hidden md:table-cell">
                    {new Date(u.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      {u.id !== user?.id ? (
                        <button
                          onClick={() => handleDelete(u.id, u.name)}
                          className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Remove from team"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-white/20 px-2 py-1">You</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Info */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
        <p className="text-xs text-white/30">
          💡 Each team member gets their own login. Everyone can view, add, edit, and export candidates.
          Changes are visible to all team members in real-time.
        </p>
      </div>
    </div>
  );
}
