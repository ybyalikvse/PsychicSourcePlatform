import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  Search,
  Hand,
  Upload,
  Send,
  CheckCircle,
  MessageSquare,
  RefreshCw,
  DollarSign,
  XCircle,
  Video,
  Smartphone,
  Monitor,
  AlertTriangle,
} from "lucide-react";

export default function PortalHowItWorks() {
  const [, setLocation] = useLocation();

  const steps = [
    {
      number: 1,
      title: "Browse Available Requests",
      icon: Search,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950",
      border: "border-blue-200 dark:border-blue-900",
      description:
        "Start by visiting the Available Requests page from the sidebar. Here you'll see all video requests that are ready to be claimed. Each request card shows:",
      details: [
        "The video title and topic",
        "A brief description of what's needed",
        "The recommended video duration",
        "The deadline for completion",
        "The pay amount for the video",
      ],
    },
    {
      number: 2,
      title: "Claim a Request",
      icon: Hand,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950",
      border: "border-purple-200 dark:border-purple-900",
      description:
        'When you find a request you\'d like to work on, click "Claim" on the request card. This assigns the request to you and sets a deadline for completion. Once claimed:',
      details: [
        "The request moves to your My Requests page",
        "No other psychic can claim the same request",
        "You'll see the full details including talking points and guidelines",
        "A deadline is automatically set (typically 7 days)",
      ],
    },
    {
      number: 3,
      title: "Review the Brief",
      icon: Video,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950",
      border: "border-indigo-200 dark:border-indigo-900",
      description:
        "Click into your claimed request to see the full details. Read through everything carefully before recording:",
      details: [
        "The hook — the attention-grabbing opening line or angle",
        "Talking points — key topics to cover in your video",
        "Description — additional context and guidelines",
        "Duration — the target length for your video",
      ],
    },
    {
      number: 4,
      title: "Record Your Video",
      icon: Smartphone,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-950",
      border: "border-teal-200 dark:border-teal-900",
      description:
        "Record your video following the brief guidelines. For best results:",
      details: [
        "Record in vertical (portrait) orientation — 9:16 aspect ratio",
        "Use good lighting and a quiet environment",
        "Speak clearly and stay on topic",
        "Keep it within the requested duration",
        "Supported formats: MP4, MOV, or WebM",
        "Maximum file size: 500 MB",
      ],
    },
    {
      number: 5,
      title: "Upload Your Video",
      icon: Upload,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950",
      border: "border-orange-200 dark:border-orange-900",
      description:
        'On the request detail page, you\'ll see the Upload section. Click "Upload Video" to select your recorded file:',
      details: [
        "A progress bar will show the upload status",
        "Once uploaded, you can preview the video right on the page",
        'You can replace your video at any time before submitting by clicking "Replace Video"',
        "Uploads go directly to secure cloud storage",
      ],
    },
    {
      number: 6,
      title: "Submit for Review",
      icon: Send,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950",
      border: "border-green-200 dark:border-green-900",
      description:
        'Once you\'re happy with your uploaded video, click "Submit for Review." This sends your video to the admin team for approval:',
      details: [
        "Your request status changes to Submitted",
        "The admin team will review your video",
        "You'll receive feedback through the messaging system on the request page",
        "You can continue to view the request while it's being reviewed",
      ],
    },
    {
      number: 7,
      title: "Receive Feedback",
      icon: MessageSquare,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-950",
      border: "border-sky-200 dark:border-sky-900",
      description:
        "After review, one of two things will happen:",
      details: [
        "Approved — Your video is accepted! You'll see a green confirmation badge on the request.",
        "Revision Requested — The admin has left feedback for you. You'll see an orange alert on your dashboard and in My Requests. Read the admin's message, then re-upload and re-submit.",
      ],
    },
    {
      number: 8,
      title: "Get Paid",
      icon: DollarSign,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950",
      border: "border-emerald-200 dark:border-emerald-900",
      description:
        "Once your video is approved and payment is processed, the request status updates to Paid. You can track all your completed work from My Requests.",
      details: [],
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">
          How It Works
        </h1>
        <p className="text-muted-foreground mt-1">
          A step-by-step guide to finding, recording, and submitting video requests.
        </p>
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Start</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
            <Badge variant="outline" className="gap-1"><Search className="h-3 w-3" /> Browse</Badge>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            <Badge variant="outline" className="gap-1"><Hand className="h-3 w-3" /> Claim</Badge>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            <Badge variant="outline" className="gap-1"><Smartphone className="h-3 w-3" /> Record</Badge>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            <Badge variant="outline" className="gap-1"><Upload className="h-3 w-3" /> Upload</Badge>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            <Badge variant="outline" className="gap-1"><Send className="h-3 w-3" /> Submit</Badge>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            <Badge variant="outline" className="gap-1"><CheckCircle className="h-3 w-3" /> Approved</Badge>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            <Badge variant="outline" className="gap-1"><DollarSign className="h-3 w-3" /> Paid</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step) => (
          <Card key={step.number} className={step.border}>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className={`shrink-0 rounded-lg p-3 h-fit ${step.bg}`}>
                  <step.icon className={`h-5 w-5 ${step.color}`} />
                </div>
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${step.color}`}>
                      Step {step.number}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  {step.details.length > 0 && (
                    <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-muted-foreground/50 shrink-0 mt-0.5">&#8226;</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Additional Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-orange-500" />
              Handling Revisions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              If the admin requests a revision, you'll see an orange alert on your Dashboard and in My Requests. Open the request to read the admin's feedback in the Messages section.
            </p>
            <p>
              Upload a new video addressing the feedback, then click "Submit for Review" again. You can go through as many revision rounds as needed until the video is approved.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Releasing a Request
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              If you've claimed a request but can't complete it, you can release it back to the pool. Click "Release Request" on the request detail page.
            </p>
            <p>
              This makes the request available for other psychics to claim. Please release requests as soon as possible if you know you won't be able to complete them.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              Messaging
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Each request has a built-in messaging thread. You can use this to communicate with the admin team about the request — ask questions, get clarification, or discuss feedback.
            </p>
            <p>
              Messages appear on the request detail page. You'll see admin messages on the left and your messages on the right.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Each claimed request has a deadline shown on the request card. Deadlines that are approaching soon will appear in red to help you prioritize your work.
            </p>
            <p>
              Try to submit your videos before the deadline. If you need more time, use the messaging system to communicate with the admin team.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="shrink-0 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">Available</Badge>
              <span className="text-muted-foreground">Open for any psychic to claim</span>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="shrink-0 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">Claimed</Badge>
              <span className="text-muted-foreground">Assigned to you — upload your video</span>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="shrink-0 bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800">Submitted</Badge>
              <span className="text-muted-foreground">Under admin review</span>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="shrink-0 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800">Revision Requested</Badge>
              <span className="text-muted-foreground">Needs changes — check feedback</span>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="shrink-0 bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">Approved</Badge>
              <span className="text-muted-foreground">Video accepted — payment pending</span>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">Paid</Badge>
              <span className="text-muted-foreground">Payment processed — all done!</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-blue-700 dark:text-blue-300">Ready to get started?</p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Browse available video requests and claim your first one.
              </p>
            </div>
            <Button
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
