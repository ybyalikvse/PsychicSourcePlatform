import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  TrendingUp,
  Users,
  Eye,
  Star,
  Target,
  Video,
  Lightbulb,
  Smartphone,
  Sun,
  Mic,
  Clock,
  Heart,
  CheckCircle,
  AlertCircle,
  ThumbsUp,
  Sparkles,
  ListChecks,
} from "lucide-react";
import { portalFetch } from "@/lib/portal-api";
import type { Psychic, VideoRequest } from "@shared/schema";

interface PortalProgramInfoProps {
  psychic?: Psychic;
}

export default function PortalProgramInfo({ psychic }: PortalProgramInfoProps) {
  const [, setLocation] = useLocation();

  const { data: availableRequests, isLoading: loadingAvailable } = useQuery<VideoRequest[]>({
    queryKey: ["/api/portal/video-requests", "available"],
    queryFn: async () => {
      const res = await portalFetch("/api/portal/video-requests?status=available");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: myRequests, isLoading: loadingMy } = useQuery<VideoRequest[]>({
    queryKey: ["/api/portal/my-requests"],
    queryFn: async () => {
      const res = await portalFetch("/api/portal/my-requests");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const availableCount = availableRequests?.length ?? 0;
  const claimedCount = myRequests?.filter(r => r.status === "claimed" || r.status === "submitted" || r.status === "revision_requested").length ?? 0;
  const approvedCount = myRequests?.filter(r => r.status === "approved").length ?? 0;
  const revisionCount = myRequests?.filter(r => r.status === "revision_requested").length ?? 0;
  const isLoading = loadingAvailable || loadingMy;

  const stats = [
    {
      title: "Available Requests",
      value: availableCount,
      description: "Requests you can claim",
      icon: Video,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      action: () => setLocation("/portal/requests"),
    },
    {
      title: "In Progress",
      value: claimedCount,
      description: revisionCount > 0 ? `${revisionCount} need${revisionCount === 1 ? "s" : ""} revision` : "Claimed & submitted",
      icon: ListChecks,
      color: revisionCount > 0 ? "text-orange-600 dark:text-orange-400" : "text-purple-600 dark:text-purple-400",
      bgColor: revisionCount > 0 ? "bg-orange-50 dark:bg-orange-950" : "bg-purple-50 dark:bg-purple-950",
      action: () => setLocation("/portal/my-requests"),
    },
    {
      title: "Approved",
      value: approvedCount,
      description: "Videos approved by admin",
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950",
      action: () => setLocation("/portal/my-requests"),
    },
  ];

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Welcome Header */}
      <div className="pb-2">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">
          Welcome{psychic ? `, ${psychic.name}` : ""}!
        </h1>
        <p className="text-lg text-foreground/70 mt-2">
          You're part of the Psychic Source Video Program — here's everything you need to know.
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={stat.action}
            data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`rounded-md p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid={`text-stat-value-${stat.title.toLowerCase().replace(/\s+/g, "-")}`}>
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {revisionCount > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-orange-700 dark:text-orange-400">
                  {revisionCount} request{revisionCount !== 1 ? "s" : ""} need{revisionCount === 1 ? "s" : ""} revision
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-500 mt-1">
                  Please review the feedback and re-upload your videos.
                </p>
              </div>
              <Button
                variant="outline"
                className="shrink-0"
                onClick={() => setLocation("/portal/my-requests")}
                data-testid="button-view-revisions"
              >
                View Requests
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hero / Value Prop */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50 border-purple-200 dark:border-purple-900">
        <CardContent className="pt-8 pb-8 space-y-4">
          <h2 className="text-xl font-bold">Grow Your Reach with Video</h2>
          <p className="text-base text-foreground/80 leading-relaxed">
            We're building a library of short, authentic videos from our psychics to share across
            Psychic Source's social media channels. The goal is simple: put you in front of thousands
            of potential clients who are actively looking for psychic guidance.
          </p>
          <p className="text-base text-foreground/80 leading-relaxed">
            You record a short video based on a topic we provide. We take care of everything
            else — editing, captions, and publishing. Your name is featured, your personality
            shines through, and viewers discover you.
          </p>
        </CardContent>
      </Card>

      {/* What's In It For You */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            What's In It For You
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3 p-4 rounded-lg bg-muted/50">
              <Users className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-base font-medium">Personal Promotion</p>
                <p className="text-sm text-foreground/75">
                  Your name and profile are featured in every video. Viewers see you, hear you, and seek you out for readings.
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-4 rounded-lg bg-muted/50">
              <Eye className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-base font-medium">Massive Reach</p>
                <p className="text-sm text-foreground/75">
                  Your videos are published across Psychic Source's social media channels — reaching thousands of potential clients you wouldn't reach on your own.
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-4 rounded-lg bg-muted/50">
              <TrendingUp className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-base font-medium">Grow Your Client Base</p>
                <p className="text-sm text-foreground/75">
                  More visibility means more bookings. Psychics who appear in our videos consistently see increased engagement and reading requests.
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-4 rounded-lg bg-muted/50">
              <Star className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-base font-medium">Build Your Brand</p>
                <p className="text-sm text-foreground/75">
                  Establish yourself as a trusted voice in your specialty areas. Short-form video is the #1 way people discover new creators today.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Where Your Videos Will Be Seen */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Where Your Videos Will Be Seen
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <p className="text-base text-foreground/80">
            Your videos are distributed across Psychic Source's official social media channels — the platforms where people actively search for psychic and spiritual content.
          </p>
          <p className="text-base text-foreground/80">
            We publish short-form vertical videos designed to reach new audiences and drive them back to Psychic Source. Your videos are positioned to reach the right people at the right time.
          </p>
        </CardContent>
      </Card>

      {/* Our Expectations */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Our Expectations
          </CardTitle>
          <p className="text-sm text-foreground/60 mt-1">These aren't rules — they're how we all succeed together.</p>
        </CardHeader>
        <CardContent className="pt-0">
          <Accordion type="single" collapsible className="w-full" defaultValue="quality">
            <AccordionItem value="quality">
              <AccordionTrigger className="text-base hover:no-underline">
                <div className="flex items-center gap-3">
                  <ThumbsUp className="h-4 w-4 text-green-500 shrink-0" />
                  Quality & Authenticity
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-base text-foreground/80 pl-7 space-y-2">
                <p>
                  Be yourself. Viewers connect with real people, not polished performances. Speak naturally and let your personality shine through. A warm, genuine delivery always outperforms a scripted, stiff one.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="briefs">
              <AccordionTrigger className="text-base hover:no-underline">
                <div className="flex items-center gap-3">
                  <Target className="h-4 w-4 text-blue-500 shrink-0" />
                  Follow the Brief
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-base text-foreground/80 pl-7 space-y-2">
                <p>
                  Each request comes with a topic, talking points, and often a hook or script. Please cover the key points outlined in the brief. You're welcome to add your own flair, but stay on topic so the video delivers the intended message.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="deadlines">
              <AccordionTrigger className="text-base hover:no-underline">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-orange-500 shrink-0" />
                  Meet Deadlines
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-base text-foreground/80 pl-7 space-y-2">
                <p>
                  Each claimed request has a deadline. Please submit your video on time. If you can't complete a request, release it as soon as possible so another psychic can pick it up. Consistent, timely delivery helps us keep content flowing.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="revisions">
              <AccordionTrigger className="text-base hover:no-underline">
                <div className="flex items-center gap-3">
                  <Heart className="h-4 w-4 text-red-500 shrink-0" />
                  Be Open to Feedback
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-base text-foreground/80 pl-7 space-y-2">
                <p>
                  Occasionally we may request a revision — this isn't a critique of your abilities, it's about making sure the video resonates with the audience. We're a team working toward the same goal: getting you more visibility and clients.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="professionalism" className="border-b-0">
              <AccordionTrigger className="text-base hover:no-underline">
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-amber-500 shrink-0" />
                  Represent the Brand Well
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-base text-foreground/80 pl-7 space-y-2">
                <p>
                  You're representing both yourself and Psychic Source. Keep content positive, empowering, and aligned with our values. Avoid making specific predictions, guarantees, or claims that could be misleading.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Best Practices for Recording */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Video className="h-5 w-5 text-indigo-500" />
            Best Practices for Recording
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Accordion type="single" collapsible className="w-full" defaultValue="framing">
            <AccordionItem value="framing">
              <AccordionTrigger className="text-base hover:no-underline">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-4 w-4 text-indigo-500 shrink-0" />
                  Framing & Orientation
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-base text-foreground/80 pl-7 space-y-3">
                <p>
                  <strong>Always record vertical (portrait mode).</strong> Hold your phone upright, not sideways. Frame yourself from the chest up, centered in the shot. Leave a little space above your head — don't crop too tight.
                </p>
                <p>
                  Keep your phone at eye level or slightly above. Avoid shooting from below — it's not flattering and feels less personal.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="lighting">
              <AccordionTrigger className="text-base hover:no-underline">
                <div className="flex items-center gap-3">
                  <Sun className="h-4 w-4 text-amber-500 shrink-0" />
                  Lighting
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-base text-foreground/80 pl-7 space-y-3">
                <p>
                  Good lighting makes a huge difference. Face a window for soft, natural light — it's the simplest way to look great on camera. Avoid having a bright light or window <em>behind</em> you, which makes your face dark.
                </p>
                <p>
                  If you're recording at night, a ring light or desk lamp placed in front of you works well. Even, consistent lighting is key.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="audio">
              <AccordionTrigger className="text-base hover:no-underline">
                <div className="flex items-center gap-3">
                  <Mic className="h-4 w-4 text-teal-500 shrink-0" />
                  Audio
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-base text-foreground/80 pl-7 space-y-3">
                <p>
                  Record in a quiet space. Turn off fans, TVs, and anything that creates background noise. Close windows if there's traffic.
                </p>
                <p>
                  Your phone's built-in microphone works fine if you're close to it (within arm's length). Speak clearly and at a natural pace — don't rush.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="background">
              <AccordionTrigger className="text-base hover:no-underline">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-4 w-4 text-purple-500 shrink-0" />
                  Background & Setting
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-base text-foreground/80 pl-7 space-y-3">
                <p>
                  Keep your background clean and uncluttered. A plain wall, bookshelf, or cozy reading space all work well. Your background should complement you, not distract from you.
                </p>
                <p>
                  If your space reflects your practice (crystals, candles, tarot cards in the background), that's great — it adds authenticity. Just keep it tidy.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="delivery">
              <AccordionTrigger className="text-base hover:no-underline">
                <div className="flex items-center gap-3">
                  <Heart className="h-4 w-4 text-red-500 shrink-0" />
                  Delivery & Energy
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-base text-foreground/80 pl-7 space-y-3">
                <p>
                  <strong>Start strong.</strong> The first 2-3 seconds determine if someone keeps watching. Open with the hook from the brief — it's designed to grab attention.
                </p>
                <p>
                  <strong>Be conversational.</strong> Imagine you're talking to a friend who asked you about this topic. Smile, make eye contact with the camera lens, and bring your natural warmth.
                </p>
                <p>
                  <strong>Keep it concise.</strong> Every second counts in short-form video. Stay focused on the talking points and avoid going on tangents. If the brief says 60 seconds, aim for 60 seconds.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="tips" className="border-b-0">
              <AccordionTrigger className="text-base hover:no-underline">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-sky-500 shrink-0" />
                  Quick Tips
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-base text-foreground/80 pl-7">
                <ul className="space-y-2">
                  <li className="flex gap-2"><span className="text-foreground/40 shrink-0">&#8226;</span> Do a 5-second test recording to check lighting and audio before the real take</li>
                  <li className="flex gap-2"><span className="text-foreground/40 shrink-0">&#8226;</span> Prop your phone against something stable or use a tripod — shaky video is distracting</li>
                  <li className="flex gap-2"><span className="text-foreground/40 shrink-0">&#8226;</span> It's okay to do multiple takes. Pick the one where you feel most natural</li>
                  <li className="flex gap-2"><span className="text-foreground/40 shrink-0">&#8226;</span> Read through the brief or script 2-3 times before recording so you're comfortable with the material</li>
                  <li className="flex gap-2"><span className="text-foreground/40 shrink-0">&#8226;</span> Don't worry about being perfect — authenticity beats perfection every time</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950">
        <CardContent className="pt-8 pb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-purple-700 dark:text-purple-300">Ready to start creating?</p>
              <p className="text-base text-purple-600 dark:text-purple-400 mt-1">
                Check out available video requests and claim your next one.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => setLocation("/portal/requests")}
              className="shrink-0"
              data-testid="button-browse-requests"
            >
              Browse Requests
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
