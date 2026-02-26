import { useState, useRef } from "react";
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
import { Star, RefreshCw, Rss, Globe, Copy, Edit2, Trash2, Loader2, CheckCircle, Clock, Square, RotateCw } from "lucide-react";
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

export default function Horoscopes() {
  const { toast } = useToast();
  const [activeType, setActiveType] = useState("daily");
  const [language, setLanguage] = useState("en");
  const [editingEntry, setEditingEntry] = useState<HoroscopeEntry | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingSign, setGeneratingSign] = useState<string | null>(null);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [failedSigns, setFailedSigns] = useState<string[]>([]);
  const [regeneratingSign, setRegeneratingSign] = useState<string | null>(null);
  const stopRef = useRef(false);

  const { data: entries = [], isLoading: entriesLoading, isError: entriesError } = useQuery<HoroscopeEntry[]>({
    queryKey: ["/api/horoscope-entries", activeType, language],
    queryFn: async () => {
      const res = await fetch(`/api/horoscope-entries?type=${activeType}&language=${language}`);
      if (!res.ok) return [];
      return res.json();
    },
    retry: 1,
  });

  const { data: cronStatus } = useQuery({
    queryKey: ["/api/horoscopes/cron-status"],
    retry: 1,
  });

  async function generateAllSigns(type: string, lang: string, force: boolean) {
    setIsGenerating(true);
    setGeneratedCount(0);
    setFailedSigns([]);
    setGeneratingSign(null);
    stopRef.current = false;

    try {
      if (force) {
        await apiRequest("POST", "/api/horoscopes/clear-period", { type, language: lang });
      }

      for (let i = 0; i < ZODIAC_SIGNS.length; i++) {
        if (stopRef.current) {
          toast({ title: "Generation stopped", description: `Completed ${i} of 12 signs before stopping.` });
          break;
        }
        const sign = ZODIAC_SIGNS[i];
        setGeneratingSign(sign);
        try {
          await apiRequest("POST", "/api/horoscopes/generate-sign", {
            type,
            language: lang,
            sign,
          });
          setGeneratedCount(i + 1);
          queryClient.invalidateQueries({ queryKey: ["/api/horoscope-entries", type, lang] });
        } catch (err: any) {
          console.error(`Failed to generate ${sign}:`, err);
          setFailedSigns(prev => [...prev, sign]);
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
      });
      queryClient.invalidateQueries({ queryKey: ["/api/horoscope-entries", activeType, language] });
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

  const currentEntries = entries.filter(e => e.type === activeType && e.language === language);

  const latestPeriod = currentEntries.length > 0 ? currentEntries[0].periodStart : null;
  const latestEntries = latestPeriod
    ? currentEntries.filter(e => e.periodStart === latestPeriod)
    : [];

  const sortedEntries = ZODIAC_SIGNS.map(s => latestEntries.find(e => e.sign === s)).filter(Boolean) as HoroscopeEntry[];

  const feedUrl = `/api/horoscopes/feed/${activeType}/${language}`;

  const status = cronStatus as any;
  const currentStatus = status?.[activeType]?.[language];

  return (
    <div className="space-y-6" data-testid="page-horoscopes">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-horoscopes-title">Horoscopes</h1>
          <p className="text-muted-foreground">Generate and manage daily, weekly, and monthly horoscopes</p>
        </div>
        <div className="flex items-center gap-3">
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
          <Button
            onClick={() => generateAllSigns(activeType, language, sortedEntries.length > 0)}
            disabled={isGenerating}
            data-testid="button-generate"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {sortedEntries.length > 0 ? "Regenerate" : "Generate"} {activeType.charAt(0).toUpperCase() + activeType.slice(1)}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="card-cron-daily">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Daily</p>
                <p className="text-xs text-muted-foreground">Every day at 5 AM ET</p>
              </div>
              {status?.daily?.[language]?.generated ? (
                <Badge variant="outline" className="text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Generated</Badge>
              ) : (
                <Badge variant="outline" className="text-orange-500"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
              )}
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
              {status?.weekly?.[language]?.generated ? (
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
              {status?.monthly?.[language]?.generated ? (
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

      <Tabs value={activeType} onValueChange={setActiveType}>
        <TabsList data-testid="tabs-horoscope-type">
          <TabsTrigger value="daily" data-testid="tab-daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly" data-testid="tab-weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly" data-testid="tab-monthly">Monthly</TabsTrigger>
        </TabsList>

        {["daily", "weekly", "monthly"].map(type => (
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
                        <p className="text-sm text-muted-foreground">{generatedCount} / 12 complete</p>
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
                        style={{ width: `${(generatedCount / 12) * 100}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ZODIAC_SIGNS.map((sign, idx) => (
                        <Badge
                          key={sign}
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => regenerateSingleSign(entry.sign, entry.id)}
                              disabled={regeneratingSign === entry.sign || isGenerating}
                              title={`Regenerate ${entry.sign}`}
                              data-testid={`button-regenerate-${entry.sign.toLowerCase()}`}
                            >
                              {regeneratingSign === entry.sign ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RotateCw className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                navigator.clipboard.writeText(entry.content);
                                toast({ title: `${entry.sign} horoscope copied` });
                              }}
                              data-testid={`button-copy-${entry.sign.toLowerCase()}`}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setEditingEntry(entry);
                                setEditContent(entry.content);
                              }}
                              data-testid={`button-edit-${entry.sign.toLowerCase()}`}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
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
