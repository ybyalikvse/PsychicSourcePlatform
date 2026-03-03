import { useState, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Star, RefreshCw, Rss, Globe, Copy, Edit2, Trash2, Loader2, CheckCircle, Clock, Square, RotateCw, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { HoroscopeEntry } from "@shared/schema";

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const ZODIAC_SYMBOLS: Record<string, string> = {
  Aries: "\u2648", Taurus: "\u2649", Gemini: "\u264A", Cancer: "\u264B",
  Leo: "\u264C", Virgo: "\u264D", Libra: "\u264E", Scorpio: "\u264F",
  Sagittarius: "\u2650", Capricorn: "\u2651", Aquarius: "\u2652", Pisces: "\u2653"
};

const DAILY_DAY_LABELS = ["Today", "Tomorrow", "+2 Days", "+3 Days"];

function getDayDateLabel(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function Horoscopes() {
  const { toast } = useToast();
  const [activeSite, setActiveSite] = useState("psychicsource");
  const [activeType, setActiveType] = useState("daily");
  const [language, setLanguage] = useState("en");
  const [dailyDaysAhead, setDailyDaysAhead] = useState(0);
  const [editingEntry, setEditingEntry] = useState<HoroscopeEntry | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingSign, setGeneratingSign] = useState<string | null>(null);
  const [generatingDay, setGeneratingDay] = useState<number | null>(null);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [totalToGenerate, setTotalToGenerate] = useState(12);
  const [failedSigns, setFailedSigns] = useState<string[]>([]);
  const [regeneratingSign, setRegeneratingSign] = useState<string | null>(null);
  const stopRef = useRef(false);

  const { data: entries = [], isLoading: entriesLoading } = useQuery<HoroscopeEntry[]>({
    queryKey: ["/api/horoscope-entries", activeType, language, activeSite],
    queryFn: async () => {
      const res = await fetch(`/api/horoscope-entries?type=${activeType}&language=${language}&site=${activeSite}`);
      if (!res.ok) return [];
      return res.json();
    },
    retry: 1,
  });

  const { data: cronStatus } = useQuery({
    queryKey: ["/api/horoscopes/cron-status"],
    retry: 1,
  });

  const status = cronStatus as any;
  const siteStatus = status?.sites?.[activeSite] || status;

  const dailyPeriodStart = useMemo(() => {
    if (!siteStatus?.daily) return null;
    const dayKey = `day${dailyDaysAhead}`;
    return siteStatus.daily[dayKey]?.[language]?.period?.start || siteStatus.daily[dayKey]?.en?.period?.start || null;
  }, [siteStatus, dailyDaysAhead, language]);

  const currentEntries = useMemo(() => {
    if (activeType === "daily") {
      if (!dailyPeriodStart) return [];
      return entries.filter(e => e.type === activeType && e.language === language && e.periodStart === dailyPeriodStart);
    }
    const filtered = entries.filter(e => e.type === activeType && e.language === language);
    const latestPeriod = filtered.length > 0 ? filtered[0].periodStart : null;
    return latestPeriod ? filtered.filter(e => e.periodStart === latestPeriod) : [];
  }, [entries, activeType, language, dailyDaysAhead, dailyPeriodStart]);

  const sortedEntries = useMemo(() => {
    return ZODIAC_SIGNS.map(s => currentEntries.find(e => e.sign === s)).filter(Boolean) as HoroscopeEntry[];
  }, [currentEntries]);

  async function generateAllSigns(type: string, lang: string, existingEntries: HoroscopeEntry[], forceAll: boolean) {
    setIsGenerating(true);
    setGeneratedCount(0);
    setFailedSigns([]);
    setGeneratingSign(null);
    setGeneratingDay(null);
    stopRef.current = false;

    try {
      if (type === "daily") {
        const daysToGen = [0, 1, 2, 3];
        let totalCount = 0;
        let completedCount = 0;

        const dayPeriodStarts: Record<number, string | null> = {};
        for (const dayOffset of daysToGen) {
          const dayKey = `day${dayOffset}`;
          dayPeriodStarts[dayOffset] = siteStatus?.daily?.[dayKey]?.[lang]?.period?.start || siteStatus?.daily?.[dayKey]?.en?.period?.start || null;
        }

        for (const dayOffset of daysToGen) {
          const periodStart = dayPeriodStarts[dayOffset];
          const dayEntries = forceAll || !periodStart ? [] : entries.filter(e => e.type === type && e.language === lang && e.periodStart === periodStart);
          const existingSigns = dayEntries.map(e => e.sign);
          const remaining = ZODIAC_SIGNS.filter(s => !existingSigns.includes(s));
          totalCount += remaining.length;
        }

        setTotalToGenerate(totalCount);
        if (totalCount === 0) {
          toast({ title: "All daily horoscopes already generated for today + 3 days", description: "Use the regenerate button on individual signs to redo specific ones." });
          setIsGenerating(false);
          return;
        }

        for (const dayOffset of daysToGen) {
          if (stopRef.current) break;

          const periodStart = dayPeriodStarts[dayOffset];
          setGeneratingDay(dayOffset);

          if (forceAll) {
            await apiRequest("POST", "/api/horoscopes/clear-period", { type, language: lang, daysAhead: dayOffset, site: activeSite });
          }

          const dayEntries = forceAll || !periodStart ? [] : entries.filter(e => e.type === type && e.language === lang && e.periodStart === periodStart);
          const existingSigns = dayEntries.map(e => e.sign);
          const signsToGenerate = ZODIAC_SIGNS.filter(s => !existingSigns.includes(s));

          for (const sign of signsToGenerate) {
            if (stopRef.current) break;
            setGeneratingSign(sign);
            try {
              await apiRequest("POST", "/api/horoscopes/generate-sign", {
                type,
                language: lang,
                sign,
                daysAhead: dayOffset,
                site: activeSite,
              });
              completedCount++;
              setGeneratedCount(completedCount);
              queryClient.invalidateQueries({ queryKey: ["/api/horoscope-entries", type, lang, activeSite] });
            } catch (err: any) {
              console.error(`Failed to generate ${sign} (day +${dayOffset}):`, err);
              setFailedSigns(prev => [...prev, `${sign}+${dayOffset}`]);
            }
          }
        }
      } else {
        const existingSigns = forceAll ? [] : existingEntries.map(e => e.sign);
        const signsToGenerate = ZODIAC_SIGNS.filter(s => !existingSigns.includes(s));
        setTotalToGenerate(signsToGenerate.length);

        if (forceAll) {
          await apiRequest("POST", "/api/horoscopes/clear-period", { type, language: lang, site: activeSite });
        }

        if (signsToGenerate.length === 0) {
          toast({ title: "All 12 signs already generated", description: "Use the regenerate button on individual signs to redo specific ones." });
          setIsGenerating(false);
          return;
        }

        for (let i = 0; i < signsToGenerate.length; i++) {
          if (stopRef.current) {
            toast({ title: "Generation stopped", description: `Completed ${i} of ${signsToGenerate.length} remaining signs before stopping.` });
            break;
          }
          const sign = signsToGenerate[i];
          setGeneratingSign(sign);
          try {
            await apiRequest("POST", "/api/horoscopes/generate-sign", {
              type,
              language: lang,
              sign,
              site: activeSite,
            });
            setGeneratedCount(i + 1);
            queryClient.invalidateQueries({ queryKey: ["/api/horoscope-entries", type, lang, activeSite] });
          } catch (err: any) {
            console.error(`Failed to generate ${sign}:`, err);
            setFailedSigns(prev => [...prev, sign]);
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/horoscope-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/horoscopes/cron-status"] });
      if (!stopRef.current) {
        toast({ title: "Horoscope generation complete" });
      }
    } catch (error: any) {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
      setGeneratingSign(null);
      setGeneratingDay(null);
      stopRef.current = false;
    }
  }

  async function generateDayOnly(dayOffset: number, lang: string, forceAll: boolean) {
    setIsGenerating(true);
    setGeneratedCount(0);
    setFailedSigns([]);
    setGeneratingSign(null);
    setGeneratingDay(dayOffset);
    stopRef.current = false;

    try {
      if (forceAll) {
        await apiRequest("POST", "/api/horoscopes/clear-period", { type: "daily", language: lang, daysAhead: dayOffset, site: activeSite });
      }

      const dayKey = `day${dayOffset}`;
      const periodStart = siteStatus?.daily?.[dayKey]?.[lang]?.period?.start || siteStatus?.daily?.[dayKey]?.en?.period?.start || null;
      const dayEntries = forceAll || !periodStart ? [] : entries.filter(e => e.type === "daily" && e.language === lang && e.periodStart === periodStart);
      const existingSigns = dayEntries.map(e => e.sign);
      const signsToGenerate = ZODIAC_SIGNS.filter(s => !existingSigns.includes(s));

      setTotalToGenerate(signsToGenerate.length);

      if (signsToGenerate.length === 0) {
        toast({ title: "All 12 signs already generated for this day" });
        setIsGenerating(false);
        return;
      }

      for (let i = 0; i < signsToGenerate.length; i++) {
        if (stopRef.current) {
          toast({ title: "Generation stopped", description: `Completed ${i} of ${signsToGenerate.length} before stopping.` });
          break;
        }
        const sign = signsToGenerate[i];
        setGeneratingSign(sign);
        try {
          await apiRequest("POST", "/api/horoscopes/generate-sign", {
            type: "daily",
            language: lang,
            sign,
            daysAhead: dayOffset,
            site: activeSite,
          });
          setGeneratedCount(i + 1);
          queryClient.invalidateQueries({ queryKey: ["/api/horoscope-entries", "daily", lang, activeSite] });
        } catch (err: any) {
          console.error(`Failed to generate ${sign}:`, err);
          setFailedSigns(prev => [...prev, sign]);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/horoscope-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/horoscopes/cron-status"] });
      if (!stopRef.current) {
        toast({ title: `Daily horoscopes generated for ${DAILY_DAY_LABELS[dayOffset]}` });
      }
    } catch (error: any) {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
      setGeneratingSign(null);
      setGeneratingDay(null);
      stopRef.current = false;
    }
  }

  async function regenerateSingleSign(sign: string, existingEntryId?: string) {
    setRegeneratingSign(sign);
    try {
      if (existingEntryId) {
        await apiRequest("DELETE", `/api/horoscope-entries/${existingEntryId}`);
      }
      await apiRequest("POST", "/api/horoscopes/generate-sign", {
        type: activeType,
        language,
        sign,
        site: activeSite,
        ...(activeType === "daily" ? { daysAhead: dailyDaysAhead } : {}),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/horoscope-entries", activeType, language, activeSite] });
      queryClient.invalidateQueries({ queryKey: ["/api/horoscopes/cron-status"] });
      toast({ title: `${sign} horoscope regenerated` });
    } catch (error: any) {
      toast({ title: `Failed to regenerate ${sign}`, description: error.message, variant: "destructive" });
    } finally {
      setRegeneratingSign(null);
    }
  }

  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const res = await apiRequest("PATCH", `/api/horoscope-entries/${id}`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/horoscope-entries"] });
      setEditingEntry(null);
      toast({ title: "Horoscope updated" });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/horoscope-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/horoscope-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/horoscopes/cron-status"] });
      toast({ title: "Entry deleted" });
    },
  });

  const feedUrl = activeType === "daily"
    ? `/api/horoscopes/feed/daily/${language}/${activeSite}?PCF=${dailyDaysAhead}`
    : `/api/horoscopes/feed/${activeType}/${language}/${activeSite}`;

  const dailyDayStatuses = useMemo(() => {
    if (!siteStatus?.daily) return [];
    return [0, 1, 2, 3].map(d => {
      const dayStatus = siteStatus.daily[`day${d}`];
      return {
        daysAhead: d,
        label: DAILY_DAY_LABELS[d],
        dateLabel: getDayDateLabel(d),
        generated: dayStatus?.[language]?.generated || false,
        count: dayStatus?.[language]?.count || 0,
      };
    });
  }, [siteStatus, language]);

  return (
    <div className="space-y-6" data-testid="page-horoscopes">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-horoscopes-title">Horoscopes</h1>
          <p className="text-muted-foreground">Generate and manage daily, weekly, and monthly horoscopes</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={activeSite} onValueChange={setActiveSite} data-testid="select-site">
            <SelectTrigger className="w-[180px]" data-testid="select-site-trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="psychicsource" data-testid="option-site-psychicsource">Psychic Source</SelectItem>
              <SelectItem value="pathforward" data-testid="option-site-pathforward">Pathforward Psychics</SelectItem>
            </SelectContent>
          </Select>
          <Select value={language} onValueChange={setLanguage} data-testid="select-language">
            <SelectTrigger className="w-[140px]" data-testid="select-language-trigger">
              <Globe className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en" data-testid="option-language-en">English</SelectItem>
              <SelectItem value="es" data-testid="option-language-es">Spanish</SelectItem>
            </SelectContent>
          </Select>
          {activeType === "daily" && (
            <>
              {sortedEntries.length > 0 && sortedEntries.length < 12 && (
                <Button
                  onClick={() => generateDayOnly(dailyDaysAhead, language, false)}
                  disabled={isGenerating || !!regeneratingSign}
                  data-testid="button-continue-generate"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Continue ({12 - sortedEntries.length} remaining)
                </Button>
              )}
              <Button
                variant={sortedEntries.length > 0 ? "outline" : "default"}
                onClick={() => generateDayOnly(dailyDaysAhead, language, sortedEntries.length > 0)}
                disabled={isGenerating || !!regeneratingSign}
                data-testid="button-generate-day"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                {sortedEntries.length > 0 ? "Regenerate" : "Generate"} {DAILY_DAY_LABELS[dailyDaysAhead]}
              </Button>
              <Button
                variant="outline"
                onClick={() => generateAllSigns("daily", language, sortedEntries, true)}
                disabled={isGenerating || !!regeneratingSign}
                data-testid="button-generate-all-days"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate All 4 Days
              </Button>
            </>
          )}
          {activeType !== "daily" && (
            <>
              {sortedEntries.length > 0 && sortedEntries.length < 12 && (
                <Button
                  onClick={() => generateAllSigns(activeType, language, sortedEntries, false)}
                  disabled={isGenerating || !!regeneratingSign}
                  data-testid="button-continue-generate"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Continue ({12 - sortedEntries.length} remaining)
                </Button>
              )}
              <Button
                variant={sortedEntries.length > 0 && sortedEntries.length < 12 ? "outline" : "default"}
                onClick={() => generateAllSigns(activeType, language, sortedEntries, sortedEntries.length > 0)}
                disabled={isGenerating || !!regeneratingSign}
                data-testid="button-generate"
              >
                {isGenerating && sortedEntries.length === 0 ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                {sortedEntries.length > 0 ? "Regenerate All" : "Generate"} {activeType.charAt(0).toUpperCase() + activeType.slice(1)}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="card-cron-daily">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Daily</p>
                <p className="text-xs text-muted-foreground">Every day at 5 AM ET (4 days)</p>
              </div>
              {(() => {
                const allGenerated = dailyDayStatuses.length > 0 && dailyDayStatuses.every(d => d.generated);
                const someGenerated = dailyDayStatuses.some(d => d.generated);
                if (allGenerated) {
                  return <Badge variant="outline" className="text-green-600"><CheckCircle className="h-3 w-3 mr-1" />4/4 Days</Badge>;
                } else if (someGenerated) {
                  const count = dailyDayStatuses.filter(d => d.generated).length;
                  return <Badge variant="outline" className="text-orange-500"><Clock className="h-3 w-3 mr-1" />{count}/4 Days</Badge>;
                }
                return <Badge variant="outline" className="text-orange-500"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
              })()}
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-cron-weekly">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Weekly</p>
                <p className="text-xs text-muted-foreground">Every Monday at 5 AM ET</p>
              </div>
              {siteStatus?.weekly?.[language]?.generated ? (
                <Badge variant="outline" className="text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Generated</Badge>
              ) : (
                <Badge variant="outline" className="text-orange-500"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
              )}
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-cron-monthly">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Monthly</p>
                <p className="text-xs text-muted-foreground">1st of month at 5 AM ET</p>
              </div>
              {siteStatus?.monthly?.[language]?.generated ? (
                <Badge variant="outline" className="text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Generated</Badge>
              ) : (
                <Badge variant="outline" className="text-orange-500"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
              )}
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-feed-url">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">XML Feed</p>
                <p className="text-xs text-muted-foreground truncate max-w-[180px]">{feedUrl}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + feedUrl);
                  toast({ title: "Feed URL copied to clipboard" });
                }}
                data-testid="button-copy-feed"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeType} onValueChange={(v) => { setActiveType(v); if (v === "daily") setDailyDaysAhead(0); }}>
        <TabsList data-testid="tabs-horoscope-type">
          <TabsTrigger value="daily" data-testid="tab-daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly" data-testid="tab-weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly" data-testid="tab-monthly">Monthly</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3].map(d => {
              const dayStatus = dailyDayStatuses[d];
              const isActive = dailyDaysAhead === d;
              return (
                <Button
                  key={d}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDailyDaysAhead(d)}
                  className="relative"
                  data-testid={`button-day-${d}`}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  {DAILY_DAY_LABELS[d]}
                  <span className="ml-1 text-xs opacity-70">({getDayDateLabel(d)})</span>
                  {dayStatus?.generated && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500" />
                  )}
                </Button>
              );
            })}
          </div>

          {isGenerating && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <p className="font-medium">
                        Generating {generatingDay !== null ? `${DAILY_DAY_LABELS[generatingDay]} - ` : ""}
                        {generatingSign ? `${ZODIAC_SYMBOLS[generatingSign]} ${generatingSign}` : "..."}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-muted-foreground">{generatedCount} / {totalToGenerate} complete</p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => { stopRef.current = true; }}
                        data-testid="button-stop-generation"
                      >
                        <Square className="h-3 w-3 mr-1" />
                        Stop
                      </Button>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${totalToGenerate > 0 ? (generatedCount / totalToGenerate) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {entriesLoading && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              </CardContent>
            </Card>
          )}

          {!entriesLoading && sortedEntries.length === 0 && !isGenerating && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Star className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No horoscopes for {DAILY_DAY_LABELS[dailyDaysAhead]} ({getDayDateLabel(dailyDaysAhead)})</h3>
                  <p className="text-muted-foreground mb-4">
                    Click "Generate {DAILY_DAY_LABELS[dailyDaysAhead]}" to create horoscopes for this day, or "Generate All 4 Days" for the full range.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Make sure you've added a horoscope prompt for daily in Settings first.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {sortedEntries.length > 0 && (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Date: {sortedEntries[0].periodStart}</span>
                <Separator orientation="vertical" className="h-4" />
                <span>{sortedEntries.length} signs</span>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-xs">Feed: ?PCF={dailyDaysAhead}</span>
                <Separator orientation="vertical" className="h-4" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto"
                  onClick={() => window.open(feedUrl, '_blank')}
                  data-testid="link-view-feed"
                >
                  <Rss className="h-3 w-3 mr-1" />
                  View XML Feed
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedEntries.map((entry) => (
                  <Card key={entry.id} data-testid={`card-horoscope-${entry.sign.toLowerCase()}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <span className="text-xl">{ZODIAC_SYMBOLS[entry.sign] || ""}</span>
                          {entry.sign}
                        </CardTitle>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => regenerateSingleSign(entry.sign, entry.id)}
                            disabled={regeneratingSign === entry.sign || isGenerating}
                            title={`Regenerate ${entry.sign}`}
                            data-testid={`button-regenerate-${entry.sign.toLowerCase()}`}
                          >
                            {regeneratingSign === entry.sign ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCw className="h-3 w-3" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => { navigator.clipboard.writeText(entry.content); toast({ title: `${entry.sign} horoscope copied` }); }}
                            data-testid={`button-copy-${entry.sign.toLowerCase()}`}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => { setEditingEntry(entry); setEditContent(entry.content); }}
                            data-testid={`button-edit-${entry.sign.toLowerCase()}`}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                            onClick={() => deleteEntryMutation.mutate(entry.id)}
                            data-testid={`button-delete-${entry.sign.toLowerCase()}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: entry.content }} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {["weekly", "monthly"].map(type => (
          <TabsContent key={type} value={type} className="space-y-4">
            {isGenerating && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <p className="font-medium">
                          Generating {generatingSign ? `${ZODIAC_SYMBOLS[generatingSign]} ${generatingSign}` : "..."}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm text-muted-foreground">{generatedCount} / {totalToGenerate} complete</p>
                        <Button variant="destructive" size="sm" onClick={() => { stopRef.current = true; }} data-testid="button-stop-generation">
                          <Square className="h-3 w-3 mr-1" />Stop
                        </Button>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${totalToGenerate > 0 ? (generatedCount / totalToGenerate) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ZODIAC_SIGNS.map((sign, idx) => (
                        <Badge key={sign}
                          variant={idx < generatedCount ? "default" : generatingSign === sign ? "outline" : "secondary"}
                          className={
                            failedSigns.includes(sign) ? "bg-destructive text-destructive-foreground" :
                            idx < generatedCount + failedSigns.filter(f => ZODIAC_SIGNS.indexOf(f) < idx).length ? "bg-green-600 text-white" :
                            generatingSign === sign ? "border-primary animate-pulse" : ""
                          }
                          data-testid={`badge-progress-${sign.toLowerCase()}`}
                        >
                          {ZODIAC_SYMBOLS[sign]} {sign}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {entriesLoading && (
              <Card><CardContent className="pt-6"><div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div></CardContent></Card>
            )}

            {!entriesLoading && sortedEntries.length === 0 && !isGenerating && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No horoscopes generated yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Click "Generate {type.charAt(0).toUpperCase() + type.slice(1)}" to create horoscopes for all 12 zodiac signs.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Make sure you've added a horoscope prompt for this type and language in Settings first.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {sortedEntries.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Period: {sortedEntries[0].periodStart === sortedEntries[0].periodEnd
                    ? sortedEntries[0].periodStart
                    : `${sortedEntries[0].periodStart} to ${sortedEntries[0].periodEnd}`
                  }</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>{sortedEntries.length} signs</span>
                  <Separator orientation="vertical" className="h-4" />
                  <Button variant="ghost" size="sm" className="p-0 h-auto"
                    onClick={() => window.open(feedUrl, '_blank')}
                    data-testid="link-view-feed"
                  >
                    <Rss className="h-3 w-3 mr-1" />View XML Feed
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedEntries.map((entry) => (
                    <Card key={entry.id} data-testid={`card-horoscope-${entry.sign.toLowerCase()}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <span className="text-xl">{ZODIAC_SYMBOLS[entry.sign] || ""}</span>
                            {entry.sign}
                          </CardTitle>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => regenerateSingleSign(entry.sign, entry.id)}
                              disabled={regeneratingSign === entry.sign || isGenerating}
                              title={`Regenerate ${entry.sign}`}
                              data-testid={`button-regenerate-${entry.sign.toLowerCase()}`}
                            >
                              {regeneratingSign === entry.sign ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCw className="h-3 w-3" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => { navigator.clipboard.writeText(entry.content); toast({ title: `${entry.sign} horoscope copied` }); }}
                              data-testid={`button-copy-${entry.sign.toLowerCase()}`}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => { setEditingEntry(entry); setEditContent(entry.content); }}
                              data-testid={`button-edit-${entry.sign.toLowerCase()}`}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                              onClick={() => deleteEntryMutation.mutate(entry.id)}
                              data-testid={`button-delete-${entry.sign.toLowerCase()}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: entry.content }} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit {editingEntry?.sign} Horoscope</DialogTitle>
            <DialogDescription>Modify the horoscope content for {editingEntry?.sign}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={8}
            data-testid="textarea-edit-horoscope"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEntry(null)} data-testid="button-cancel-edit">Cancel</Button>
            <Button
              onClick={() => editingEntry && updateEntryMutation.mutate({ id: editingEntry.id, content: editContent })}
              disabled={updateEntryMutation.isPending}
              data-testid="button-save-edit"
            >
              {updateEntryMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
