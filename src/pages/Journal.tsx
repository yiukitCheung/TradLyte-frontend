import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isSameDay } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JournalPurposePrompt from "@/components/JournalPurposePrompt";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BookOpen,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Trophy,
  Star,
  Loader2,
  MessageCircle,
  SendHorizontal,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { POINTS_PER_JOURNAL_ENTRY, nextLevelThresholdPoints } from "@/lib/rewards";
import { consecutiveJournalDays } from "@/lib/journalStreak";
import { cn } from "@/lib/utils";

type JournalRow = Tables<"journal_entries">;

const ENTRY_COLUMNS = "id,title,content,mood,tags,created_at" as const;

const MOODS = ["Reflective", "Calm", "Focused", "Motivated", "Anxious", "Neutral"] as const;

type ChatMsg = { role: "ai" | "user"; text: string };
type MiniMaxMessage = { role: "user" | "assistant"; content: Array<{ type: "text"; text: string }> };

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{children}</p>;
}

const Journal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [journalText, setJournalText] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [selectedStock, setSelectedStock] = useState("");
  const [mood, setMood] = useState<string>("Reflective");
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    {
      role: "ai",
      text: "I'm here to nudge your thinking — share how today went in your own words. When you save, it becomes today's journal entry and earns Tradlyte points.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatThinking, setChatThinking] = useState(false);

  const [entries, setEntries] = useState<JournalRow[]>([]);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [rewardLevel, setRewardLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const journalPrompts = [
    { id: "win", label: "Today's win", icon: TrendingUp, tint: "text-emerald-700 dark:text-emerald-400" },
    { id: "loss", label: "Today's lesson", icon: TrendingDown, tint: "text-rose-700 dark:text-rose-400" },
    { id: "reflection", label: "Reflection", icon: Lightbulb, tint: "text-amber-700 dark:text-amber-400" },
    { id: "lesson", label: "Lesson learned", icon: BookOpen, tint: "text-sky-800 dark:text-sky-400" },
  ];

  const stocks = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "NVDA"];

  const loadRewards = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("reward_points, reward_level")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.warn("Journal: rewards load failed", error.message);
      return;
    }
    if (data) {
      setRewardPoints(Number(data.reward_points ?? 0));
      setRewardLevel(Number(data.reward_level ?? 1));
    }
  }, [user]);

  const loadEntries = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("journal_entries")
      .select(ENTRY_COLUMNS)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(60);

    if (error) {
      toast.error(error.message || "Couldn't load journal");
      return;
    }
    setEntries((data ?? []) as JournalRow[]);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      await Promise.all([loadEntries(), loadRewards()]);
      setLoading(false);
    })();
  }, [user, loadEntries, loadRewards]);

  const streakDays = useMemo(
    () => consecutiveJournalDays(entries.map((e) => e.created_at)),
    [entries],
  );

  const todayEntries = useMemo(
    () =>
      entries.filter(
        (e) => e.created_at && isSameDay(parseISO(e.created_at), new Date()),
      ),
    [entries],
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const nextTierAt = nextLevelThresholdPoints(rewardPoints);
  const progressToNext =
    nextTierAt != null ? Math.min(100, (rewardPoints / nextTierAt) * 100) : 100;

  const deriveTitle = (body: string) => {
    const line = body
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 0);
    if (!line) return `Journal · ${format(new Date(), "MMM d, yyyy")}`;
    return line.length > 100 ? `${line.slice(0, 97)}…` : line;
  };

  const handlePromptSelect = (promptId: string) => {
    setSelectedPrompt(promptId);
    const prompt = journalPrompts.find((p) => p.id === promptId);
    setChatMessages((prev) => [
      ...prev,
      { role: "user", text: `Topic: ${prompt?.label ?? promptId}` },
      {
        role: "ai",
        text: `${prompt?.label ?? "This topic"} — unpack what happened and how it fits your plan. I'll save whatever you write below for today.`,
      },
    ]);
  };

  const handlePurposePromptSelect = (promptText: string) => {
    setChatMessages((prev) => [
      ...prev,
      { role: "user", text: promptText },
      {
        role: "ai",
        text: "Strong angle — expand in your own words, then save to log it for today.",
      },
    ]);
    setJournalText((t) => (t ? `${t}\n${promptText}\n\n` : `${promptText}\n\n`));
  };

  const handleStockSelect = (stock: string) => {
    setSelectedStock(stock);
    setChatMessages((prev) => [
      ...prev,
      { role: "user", text: `Context: ${stock}` },
      {
        role: "ai",
        text: `What stood out with ${stock} today — and what did you do (or consciously not do)?`,
      },
    ]);
  };

  const truncateForChat = (text: string, max = 400) =>
    text.length <= max ? text : `${text.slice(0, max)}…`;

  const toMiniMaxHistory = (messages: ChatMsg[]): MiniMaxMessage[] =>
    messages
      .slice(-8)
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: [{ type: "text", text: m.text }],
      }));

  const requestMiniMaxReply = async (nextHistory: ChatMsg[]): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("ai-chat", {
      body: {
        messages: toMiniMaxHistory(nextHistory),
      },
    });
    if (error) {
      const contextResponse = "context" in error ? ((error as { context?: unknown }).context as Response | undefined) : undefined;
      const errText = contextResponse ? await contextResponse.text().catch(() => "") : "";
      throw new Error(`MiniMax request failed: ${errText || error.message}`);
    }
    const text = (data as { text?: unknown } | null)?.text;
    if (!text) throw new Error("MiniMax returned no text content.");
    return String(text);
  };

  const handleSendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatThinking) return;

    const nextHistory = [...chatMessages, { role: "user", text } satisfies ChatMsg];
    setChatMessages(nextHistory);
    setJournalText((prev) => (prev ? `${prev}\n\n${text}` : text));
    setChatInput("");
    setChatThinking(true);

    try {
      const aiReply = await requestMiniMaxReply(nextHistory);
      setChatMessages((prev) => [...prev, { role: "ai", text: aiReply }]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not get AI response";
      setChatMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "I couldn't reach MiniMax right now. You can still write your reflection and save today's entry.",
        },
      ]);
      toast.error(message);
    } finally {
      setChatThinking(false);
    }
  };

  const handleSaveJournal = async () => {
    if (!user) return;
    const body = journalText.trim();
    if (!body) {
      toast.error("Write something before saving.");
      return;
    }

    setSaving(true);
    try {
      const tags = [selectedPrompt, selectedStock].filter(Boolean);
      const { error } = await supabase.from("journal_entries").insert({
        user_id: user.id,
        title: deriveTitle(body),
        content: body,
        mood: mood === "Neutral" ? null : mood,
        tags: tags.length ? tags : null,
      });

      if (error) throw error;

      const preview = truncateForChat(body);
      setChatMessages((prev) => [
        ...prev,
        { role: "user", text: preview },
        {
          role: "ai",
          text: `Logged · ${format(new Date(), "EEEE, MMM d")} · +${POINTS_PER_JOURNAL_ENTRY} points when your profile syncs. Add another note anytime.`,
        },
      ]);

      toast.success(`Today's entry saved · +${POINTS_PER_JOURNAL_ENTRY} points`);
      setJournalText("");
      setSelectedPrompt("");
      setSelectedStock("");
      await Promise.all([loadEntries(), loadRewards()]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Couldn't save journal";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md rounded-stadium shadow-elegant border-border/50 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-80" />
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-xl">Journal</CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Sign in so entries sync to your account and count toward rewards.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <Button onClick={() => navigate("/auth")} className="w-full rounded-xl shadow-elegant h-11">
              Sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative isolate">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -top-24 right-[-10%] h-[380px] w-[380px] rounded-full bg-primary/[0.07] blur-3xl" />
        <div className="absolute top-[40%] left-[-15%] h-[320px] w-[320px] rounded-full bg-accent/[0.06] blur-3xl" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-70" />
      </div>

      <Header />
      <main className="flex-1 relative z-10 mx-auto w-full max-w-7xl px-4 py-6 pb-16 lg:px-6">
        <header className="mb-5 space-y-4">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/80">Daily reflection</p>
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 text-primary shadow-sm ring-1 ring-primary/10">
                  <MessageCircle className="h-7 w-7" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 pt-0.5">
                  <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                    Tradlyte journal
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-md">
                    Save as <span className="text-foreground/90 font-medium">today&apos;s entry</span> ·{" "}
                    <span className="tabular-nums">{POINTS_PER_JOURNAL_ENTRY}</span> pts each · streak{" "}
                    <span className="tabular-nums font-medium text-foreground">{streakDays}</span>d
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground/90 leading-snug inline-flex items-center gap-1.5">
                    <span className="inline-block h-1 w-1 rounded-full bg-accent" aria-hidden />
                    Chat hints are scripted (not live AI).
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full sm:w-[296px] shrink-0 rounded-2xl p-[1px] bg-gradient-to-br from-primary/25 via-border/40 to-accent/25 shadow-elegant">
              <div className="rounded-2xl bg-card/95 backdrop-blur-sm border border-transparent px-5 py-4">
                {loading ? (
                  <div className="flex items-center gap-2.5 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Syncing rewards…
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/12 to-accent/10">
                      <Trophy className="h-6 w-6 text-primary" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="rounded-lg border-0 bg-primary/12 text-primary hover:bg-primary/15 font-mono text-[11px] px-2 py-0.5">
                          Lv {rewardLevel}
                        </Badge>
                        <span className="inline-flex items-center gap-1 text-lg font-semibold tabular-nums tracking-tight">
                          <Star className="h-4 w-4 text-accent fill-accent/40" />
                          {rewardPoints}
                        </span>
                      </div>
                      <Progress value={progressToNext} className="h-1.5 mt-3 rounded-full bg-muted" />
                      <p className="text-[11px] text-muted-foreground mt-2 leading-snug">
                        {nextTierAt != null ? (
                          <>
                            <span className="tabular-nums font-medium text-foreground/80">
                              {nextTierAt - rewardPoints}
                            </span>{" "}
                            pts to tier <span className="tabular-nums">{nextTierAt}</span>
                          </>
                        ) : (
                          "Top tier in this view"
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Card className="rounded-stadium border-border/40 shadow-elegant overflow-hidden flex flex-col min-h-[min(620px,calc(100vh-11rem))] max-h-[calc(100vh-6.5rem)] bg-card/80 backdrop-blur-[2px] ring-1 ring-black/[0.03] dark:ring-white/[0.06]">
            <CardHeader className="border-b border-border/40 bg-gradient-to-r from-primary/[0.06] via-card to-accent/[0.05] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="h-12 w-12 rounded-2xl border border-border/50 shadow-sm ring-2 ring-background bg-gradient-to-br from-primary/15 via-background to-accent/15 flex items-center justify-center">
                    <Bot className="h-6 w-6 text-primary" strokeWidth={2} />
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" aria-hidden />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-lg font-display font-semibold tracking-tight">
                    Today&apos;s thread
                  </CardTitle>
                  <CardDescription className="mt-1 text-[13px] leading-relaxed">
                    {format(new Date(), "EEEE, MMMM d")}
                    <span className="mx-2 text-border">·</span>
                    Chat-first journaling feed
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col flex-1 p-4 sm:p-5 min-h-0 gap-3">
              <div
                className={cn(
                  "relative flex-1 min-h-[260px] overflow-y-auto rounded-2xl px-3 py-4 sm:px-4 space-y-4",
                  "bg-[radial-gradient(circle_at_1px_1px,hsl(var(--border)/0.45)_1px,transparent_0)] [background-size:18px_18px]",
                  "bg-muted/40 border border-border/50 shadow-inner",
                )}
              >
                {chatMessages.map((msg, idx) => (
                  <div
                    key={`${idx}-${msg.role}-${msg.text.slice(0, 12)}`}
                    className={cn(
                      "flex items-end gap-2.5",
                      msg.role === "user" ? "flex-row-reverse" : "",
                    )}
                  >
                    {msg.role === "ai" ? (
                      <div className="h-9 w-9 rounded-xl border border-border/60 bg-gradient-to-br from-primary/15 via-background to-accent/15 shadow-sm shrink-0 flex items-center justify-center">
                        <Bot className="h-4.5 w-4.5 text-primary" strokeWidth={2} />
                      </div>
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/85 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-md">
                        You
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[min(92%,34rem)] text-[13px] leading-relaxed px-4 py-2.5 shadow-sm transition-shadow",
                        msg.role === "ai"
                          ? "rounded-2xl rounded-tl-md bg-card/95 border border-border/55 text-foreground/95"
                          : "rounded-2xl rounded-tr-md text-primary-foreground bg-gradient-to-br from-primary via-primary to-primary/90 border border-primary/20",
                      )}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                <FieldLabel>Chat with Tradlyte AI</FieldLabel>
                <div className="flex items-end gap-2">
                  <Textarea
                    placeholder="Tell Tradlyte what happened today..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="min-h-[84px] border-border/60 bg-card resize-none"
                  />
                  <Button
                    type="button"
                    onClick={handleSendChat}
                    className="h-10 px-4 rounded-xl shrink-0"
                    disabled={!chatInput.trim() || chatThinking}
                  >
                    {chatThinking ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Thinking
                      </>
                    ) : (
                      <>
                        <SendHorizontal className="h-4 w-4 mr-1" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-stadium border-border/40 shadow-card bg-card/85">
              <CardContent className="p-4 sm:p-4 space-y-4">
                <JournalPurposePrompt variant="embedded" onSelectPrompt={handlePurposePromptSelect} />

                <div>
                  <FieldLabel>Prompt style</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {journalPrompts.map((prompt) => {
                      const Icon = prompt.icon;
                      const active = selectedPrompt === prompt.id;
                      return (
                        <Button
                          key={prompt.id}
                          type="button"
                          variant={active ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "h-9 rounded-xl border px-3.5 text-xs font-medium transition-all duration-200",
                            active
                              ? "shadow-md ring-2 ring-primary/20"
                              : "border-border/60 bg-background/80 hover:bg-muted/60 hover:border-border",
                          )}
                          onClick={() => handlePromptSelect(prompt.id)}
                        >
                          <Icon className={cn("h-3.5 w-3.5 mr-2", prompt.tint)} strokeWidth={2} />
                          {prompt.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
                  <div>
                    <FieldLabel>Stock</FieldLabel>
                    <Select
                      value={selectedStock || "__none__"}
                      onValueChange={(v) =>
                        v === "__none__" ? setSelectedStock("") : handleStockSelect(v)
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background/90">
                        <SelectValue placeholder="Optional ticker" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {stocks.map((stock) => (
                          <SelectItem key={stock} value={stock}>
                            {stock}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>Mood</FieldLabel>
                    <Select value={mood} onValueChange={setMood}>
                      <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background/90">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MOODS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/50 p-[1px] shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-shadow">
                  <div className="rounded-2xl bg-card/90 px-4 pt-3 pb-2">
                    <FieldLabel>Your entry</FieldLabel>
                    <Textarea
                      placeholder="Today I noticed… (markets, discipline, patience — whatever matters)"
                      value={journalText}
                      onChange={(e) => setJournalText(e.target.value)}
                      className="min-h-[132px] border-0 bg-transparent px-0 py-0 text-[15px] leading-relaxed shadow-none resize-none rounded-none focus-visible:ring-0 placeholder:text-muted-foreground/65"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/40 mt-3">
                      <p className="text-[11px] tabular-nums text-muted-foreground">{journalText.length} chars</p>
                      <Button
                        type="button"
                        onClick={handleSaveJournal}
                        disabled={saving}
                        className="rounded-xl h-11 px-5 gap-2 shadow-elegant font-semibold tracking-tight"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          <>
                            <SendHorizontal className="h-4 w-4" strokeWidth={2} />
                            Save today · +{POINTS_PER_JOURNAL_ENTRY}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <section className="rounded-stadium border border-border/35 bg-card/70 shadow-card overflow-hidden ring-1 ring-black/[0.02] dark:ring-white/[0.04]">
              <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border/40 bg-muted/25">
                <div>
                  <h2 className="font-display text-base font-semibold tracking-tight">Today&apos;s log</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Synced entries for this calendar day</p>
                </div>
                <Badge variant="outline" className="rounded-lg tabular-nums font-semibold px-2.5 py-0.5 border-primary/20 text-primary">
                  {todayEntries.length}
                </Badge>
              </div>
              <div className="p-3 space-y-2.5 max-h-[320px] overflow-y-auto">
                {todayEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10 px-4 leading-relaxed">
                    Nothing yet today — your next save shows up here with time and tags.
                  </p>
                ) : (
                  todayEntries.map((entry) => (
                    <button
                      type="button"
                      key={entry.id}
                      className={cn(
                        "group w-full text-left rounded-2xl border border-border/45 bg-gradient-to-br from-card to-muted/20 px-4 py-3.5",
                        "hover:border-primary/25 hover:shadow-md transition-all duration-200",
                        "relative overflow-hidden",
                      )}
                      onClick={() => {
                        void navigator.clipboard.writeText(entry.content).then(() => toast.message("Copied"));
                      }}
                    >
                      <span
                        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-gradient-to-b from-primary/60 to-accent/50 opacity-80"
                        aria-hidden
                      />
                      <div className="pl-2.5">
                        <div className="flex justify-between gap-2 mb-1.5 flex-wrap items-center">
                          <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                            {entry.created_at ? format(parseISO(entry.created_at), "h:mm a") : ""}
                          </span>
                          <span className="flex gap-1 flex-wrap justify-end">
                            {entry.mood && (
                              <Badge variant="secondary" className="text-[10px] font-normal rounded-md px-2">
                                {entry.mood}
                              </Badge>
                            )}
                            {entry.tags?.map((t) => (
                              <Badge key={String(t)} variant="outline" className="text-[10px] rounded-md px-2 border-border/60">
                                {t}
                              </Badge>
                            ))}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-foreground/95 line-clamp-2 group-hover:text-primary transition-colors">
                          {entry.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{entry.content}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Journal;
