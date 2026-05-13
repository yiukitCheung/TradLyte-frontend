import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
  Trash2,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { evaluatePassword, MIN_PASSWORD_LENGTH } from "@/lib/passwordPolicy";
import type { Tables } from "@/integrations/supabase/types";

type ProfileRow = Tables<"profiles">;

const PRIMARY_GOAL_OPTIONS: string[] = [
  "Financial freedom for family",
  "Pursue my passion full-time",
  "Support causes I care about",
  "Create generational wealth",
  "Achieve financial independence",
  "Other",
];

const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "Beginner — just starting out" },
  { value: "intermediate", label: "Intermediate — some experience" },
  { value: "advanced", label: "Advanced — experienced investor" },
] as const;

const TIME_HORIZON_OPTIONS = [
  { value: "short", label: "Short — 1 to 3 years" },
  { value: "medium", label: "Medium — 3 to 10 years" },
  { value: "long", label: "Long — 10+ years" },
] as const;

const RISK_TOLERANCE_OPTIONS = [
  { value: "conservative", label: "Conservative" },
  { value: "moderate", label: "Moderate" },
  { value: "aggressive", label: "Aggressive" },
] as const;

const strengthMeta: Record<
  ReturnType<typeof evaluatePassword>["strengthLabel"],
  { label: string; tone: string; value: number }
> = {
  "very-weak": { label: "Very weak", tone: "text-rose-500", value: 10 },
  weak: { label: "Weak", tone: "text-rose-500", value: 30 },
  fair: { label: "Fair", tone: "text-amber-500", value: 55 },
  good: { label: "Good", tone: "text-emerald-500", value: 80 },
  strong: { label: "Strong", tone: "text-emerald-500", value: 100 },
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading, signOut, updatePassword } = useAuth();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState<string>("");
  const [customGoal, setCustomGoal] = useState("");
  const [purposeStatement, setPurposeStatement] = useState("");
  const [experience, setExperience] = useState<string>("");
  const [horizon, setHorizon] = useState<string>("");
  const [risk, setRisk] = useState<string>("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [loading, user, navigate]);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setProfileLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, reward_points, reward_level, onboarding_complete, primary_goal, purpose_statement, investment_experience, time_horizon, risk_tolerance, created_at, updated_at",
      )
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      toast.error(error.message || "Could not load your profile.");
      setProfileLoading(false);
      return;
    }

    const row = (data ?? null) as ProfileRow | null;
    setProfile(row);
    setFullName(
      row?.full_name ?? ((user.user_metadata?.full_name as string | undefined) ?? ""),
    );
    const savedGoal = row?.primary_goal ?? "";
    if (savedGoal && !PRIMARY_GOAL_OPTIONS.includes(savedGoal)) {
      setPrimaryGoal("Other");
      setCustomGoal(savedGoal);
    } else {
      setPrimaryGoal(savedGoal);
      setCustomGoal("");
    }
    setPurposeStatement(row?.purpose_statement ?? "");
    setExperience(row?.investment_experience ?? "");
    setHorizon(row?.time_horizon ?? "");
    setRisk(row?.risk_tolerance ?? "");
    setProfileLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) void loadProfile();
  }, [user, loadProfile]);

  const passwordEvaluation = useMemo(
    () =>
      evaluatePassword(newPassword, {
        email: user?.email ?? null,
        fullName,
      }),
    [newPassword, user?.email, fullName],
  );

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canChangePassword =
    !!currentPassword &&
    passwordEvaluation.ok &&
    passwordsMatch &&
    !changingPassword;

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const resolvedGoal =
        primaryGoal === "Other" ? customGoal.trim() : primaryGoal.trim();

      const { error } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          full_name: fullName.trim() || null,
          primary_goal: resolvedGoal || null,
          purpose_statement: purposeStatement.trim() || null,
          investment_experience: experience || null,
          time_horizon: horizon || null,
          risk_tolerance: risk || null,
          onboarding_complete: profile?.onboarding_complete ?? true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      if (error) {
        toast.error(error.message || "Could not save your profile.");
        return;
      }

      // Mirror full_name into user_metadata for consistency.
      const { error: metaError } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() || null },
      });
      if (metaError) {
        console.warn("[profile] metadata update failed:", metaError.message);
      }

      toast.success("Profile saved.");
      await loadProfile();
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.email || !canChangePassword) return;

    setChangingPassword(true);
    try {
      // Re-authenticate with the current password to prove session ownership.
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (reauthError) {
        toast.error("Current password is incorrect.");
        return;
      }

      const { error } = await updatePassword(newPassword);
      if (error) {
        toast.error(error.message || "Could not update password.");
        return;
      }

      toast.success("Password updated. Please sign in again for safety.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await signOut();
      navigate("/auth", { replace: true });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.email) return;
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") {
      toast.error('Type "DELETE" to confirm.');
      return;
    }
    if (!deletePassword) {
      toast.error("Enter your password to confirm.");
      return;
    }

    setDeleting(true);
    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deletePassword,
      });
      if (reauthError) {
        toast.error("Password is incorrect.");
        return;
      }

      const { error } = await supabase.functions.invoke("delete-account", {
        body: {},
      });
      if (error) {
        const ctx = (error as { context?: unknown }).context;
        const detail =
          ctx instanceof Response ? await ctx.text().catch(() => "") : "";
        toast.error(`Could not delete account: ${detail || error.message}`);
        return;
      }

      toast.success("Your account has been deleted.");
      await supabase.auth.signOut();
      navigate("/", { replace: true });
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const strength = strengthMeta[passwordEvaluation.strengthLabel];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 lg:px-6 space-y-8">
        <header className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/80">
            Your account
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Profile
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your details, purpose, and security in one place.
          </p>
        </header>

        {/* Account */}
        <Card className="rounded-stadium border-border/50 shadow-elegant">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display text-xl">Account</CardTitle>
                <CardDescription>Basic identity and rewards summary.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Email
                </Label>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 h-11 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{user.email}</span>
                  {user.email_confirmed_at ? (
                    <Badge className="ml-auto bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 border-0">
                      Verified
                    </Badge>
                  ) : (
                    <Badge className="ml-auto bg-amber-500/15 text-amber-600 hover:bg-amber-500/20 border-0">
                      Unverified
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Email changes are not supported here yet — contact support.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Rewards
                </Label>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3 h-11 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium tabular-nums">
                    {profile?.reward_points ?? 0} pts
                  </span>
                  <span className="text-muted-foreground">
                    · Lv {profile?.reward_level ?? 1}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purpose */}
        <form onSubmit={handleSaveProfile}>
          <Card className="rounded-stadium border-border/50 shadow-elegant">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-display text-xl">Purpose & profile</CardTitle>
                  <CardDescription>
                    What you shared during onboarding — edit anytime.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {profileLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading profile…
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full name</Label>
                    <Input
                      id="full-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>What matters most to you</Label>
                    <Select value={primaryGoal} onValueChange={setPrimaryGoal}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Choose a primary goal" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIMARY_GOAL_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {primaryGoal === "Other" && (
                      <Input
                        value={customGoal}
                        onChange={(e) => setCustomGoal(e.target.value)}
                        placeholder="Your own purpose"
                        className="h-11"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose-statement">How wealth serves that purpose</Label>
                    <Textarea
                      id="purpose-statement"
                      value={purposeStatement}
                      onChange={(e) => setPurposeStatement(e.target.value)}
                      placeholder="What freedom or impact does wealth unlock for you?"
                      className="min-h-[110px]"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Investment experience</Label>
                      <Select value={experience} onValueChange={setExperience}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Choose…" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPERIENCE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Time horizon</Label>
                      <Select value={horizon} onValueChange={setHorizon}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Choose…" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_HORIZON_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Risk tolerance</Label>
                      <Select value={risk} onValueChange={setRisk}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Choose…" />
                        </SelectTrigger>
                        <SelectContent>
                          {RISK_TOLERANCE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving} className="h-11 px-5">
                      {saving ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                        </span>
                      ) : (
                        "Save changes"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </form>

        {/* Security */}
        <Card className="rounded-stadium border-border/50 shadow-elegant">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display text-xl">Security</CardTitle>
                <CardDescription>
                  Change your password. Requires your current password.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={`${MIN_PASSWORD_LENGTH}+ characters`}
                  className="h-11"
                  required
                />
                {newPassword.length > 0 && (
                  <>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-muted-foreground">Strength</span>
                      <span className={cn("font-medium", strength.tone)}>{strength.label}</span>
                    </div>
                    <Progress value={strength.value} className="h-1.5 rounded-full bg-muted" />
                    <ul className="space-y-1 rounded-2xl border border-border bg-muted/30 p-3 mt-2">
                      {passwordEvaluation.rules.map((rule) => (
                        <li
                          key={rule.id}
                          className={cn(
                            "flex items-center gap-2 text-xs",
                            rule.ok
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground",
                          )}
                        >
                          {rule.ok ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 shrink-0 opacity-60" />
                          )}
                          <span>{rule.label}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "h-11",
                    confirmPassword.length > 0 && !passwordsMatch && "border-rose-500 focus-visible:ring-rose-500",
                  )}
                  required
                />
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-rose-500">Passwords do not match.</p>
                )}
              </div>
              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-2"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
                <Button
                  type="submit"
                  className="h-11 px-5 gap-2"
                  disabled={!canChangePassword}
                >
                  <KeyRound className="h-4 w-4" />
                  {changingPassword ? "Updating…" : "Update password"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card className="rounded-stadium border-rose-500/30 shadow-elegant">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <CardTitle className="font-display text-xl text-rose-600 dark:text-rose-400">
                  Danger zone
                </CardTitle>
                <CardDescription>
                  Permanently delete your account and all associated data.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-4">
              <div className="text-sm text-muted-foreground leading-relaxed">
                Deleting your account removes your profile, journal entries, goals, and
                portfolio data. This action cannot be undone.
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2 shrink-0">
                    <Trash2 className="h-4 w-4" />
                    Delete account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete account permanently?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will sign you out and remove all data tied to{" "}
                      <span className="font-semibold">{user.email}</span>. Confirm by
                      entering your password and typing <strong>DELETE</strong>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="delete-password" className="text-xs uppercase tracking-wider text-muted-foreground">
                        Your password
                      </Label>
                      <Input
                        id="delete-password"
                        type="password"
                        autoComplete="current-password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="delete-confirm" className="text-xs uppercase tracking-wider text-muted-foreground">
                        Type DELETE
                      </Label>
                      <Input
                        id="delete-confirm"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="DELETE"
                        className="h-11"
                      />
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => {
                        setDeletePassword("");
                        setDeleteConfirmText("");
                      }}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-rose-600 hover:bg-rose-700 text-white"
                      disabled={deleting}
                    >
                      {deleting ? "Deleting…" : "Delete forever"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
