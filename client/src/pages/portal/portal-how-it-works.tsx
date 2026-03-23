import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

export default function PortalHowItWorks() {
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">
          How It Works
        </h1>
        <p className="text-muted-foreground mt-1">
          Your guide to finding, recording, and submitting video requests.
        </p>
      </div>

      {/* Quick Start Flow */}
      <Card>
        <CardContent className="pt-6 pb-5">
          <p className="text-sm font-medium mb-3">The process at a glance</p>
          <div className="flex flex-wrap gap-2 items-center text-sm">
            <Badge variant="secondary" className="gap-1.5 py-1"><Search className="h-3 w-3" /> Browse</Badge>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
            <Badge variant="secondary" className="gap-1.5 py-1"><Hand className="h-3 w-3" /> Claim</Badge>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
            <Badge variant="secondary" className="gap-1.5 py-1"><Smartphone className="h-3 w-3" /> Record</Badge>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
            <Badge variant="secondary" className="gap-1.5 py-1"><Upload className="h-3 w-3" /> Upload</Badge>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
            <Badge variant="secondary" className="gap-1.5 py-1"><Send className="h-3 w-3" /> Submit</Badge>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
            <Badge variant="secondary" className="gap-1.5 py-1"><CheckCircle className="h-3 w-3" /> Approved</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Steps Accordion */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Step-by-Step Guide</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="step-1">
              <AccordionTrigger className="text-sm hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="shrink-0 rounded-md p-1.5 bg-blue-50 dark:bg-blue-950">
                    <Search className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-normal">1.</span>
                    Browse Available Requests
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pl-11 space-y-2">
                <p>
                  Visit the <strong>Available Requests</strong> page from the sidebar. You'll see all video requests ready to be claimed. Each card shows the title, topic, description, recommended duration, and deadline.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-2">
              <AccordionTrigger className="text-sm hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="shrink-0 rounded-md p-1.5 bg-purple-50 dark:bg-purple-950">
                    <Hand className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-normal">2.</span>
                    Claim a Request
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pl-11 space-y-2">
                <p>
                  Click <strong>"Claim"</strong> on any request to assign it to yourself. Once claimed, the request moves to your <strong>My Requests</strong> page and no other psychic can take it. A deadline is automatically set (typically 7 days).
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-3">
              <AccordionTrigger className="text-sm hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="shrink-0 rounded-md p-1.5 bg-indigo-50 dark:bg-indigo-950">
                    <Video className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-normal">3.</span>
                    Review the Brief
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pl-11 space-y-2">
                <p>
                  Click into your claimed request to see the full details. Read through everything carefully before recording — the hook, talking points, description, and target duration. Full scripts are also available if you prefer to read the complete text.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-4">
              <AccordionTrigger className="text-sm hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="shrink-0 rounded-md p-1.5 bg-teal-50 dark:bg-teal-950">
                    <Smartphone className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-normal">4.</span>
                    Record Your Video
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pl-11 space-y-2">
                <p>
                  Record in vertical (portrait) orientation with good lighting and a quiet environment. Speak clearly, stay on topic, and keep it within the requested duration.
                </p>
                <p className="text-xs">
                  Supported formats: MP4, MOV, or WebM. Maximum file size: 500 MB.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-5">
              <AccordionTrigger className="text-sm hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="shrink-0 rounded-md p-1.5 bg-orange-50 dark:bg-orange-950">
                    <Upload className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-normal">5.</span>
                    Upload Your Video
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pl-11 space-y-2">
                <p>
                  On the request detail page, click <strong>"Upload Video"</strong> to select your file. A progress bar shows the upload status. Once uploaded, you can preview it on the page and replace it at any time before submitting.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-6">
              <AccordionTrigger className="text-sm hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="shrink-0 rounded-md p-1.5 bg-green-50 dark:bg-green-950">
                    <Send className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-normal">6.</span>
                    Submit for Review
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pl-11 space-y-2">
                <p>
                  Click <strong>"Submit for Review"</strong> to send your video to the admin team. Your status changes to <strong>Submitted</strong> and you'll receive feedback through the messaging system on the request page.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-7" className="border-b-0">
              <AccordionTrigger className="text-sm hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="shrink-0 rounded-md p-1.5 bg-sky-50 dark:bg-sky-950">
                    <CheckCircle className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-normal">7.</span>
                    Receive Feedback
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pl-11 space-y-2">
                <p>
                  After review, your video will either be <strong>Approved</strong> (green badge) or have a <strong>Revision Requested</strong> (orange alert). If revisions are needed, read the admin's feedback, re-upload your video, and submit again.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Good to Know */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Good to Know</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="revisions">
              <AccordionTrigger className="text-sm hover:no-underline">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                  Handling Revisions
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pl-7 space-y-2">
                <p>
                  If the admin requests a revision, you'll see an orange alert on your Dashboard and in My Requests. Open the request, read the feedback in Messages, upload a new video, and submit again.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="release">
              <AccordionTrigger className="text-sm hover:no-underline">
                <div className="flex items-center gap-3">
                  <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  Releasing a Request
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pl-7 space-y-2">
                <p>
                  Can't complete a claimed request? Click <strong>"Release Request"</strong> on the detail page to return it to the pool for other psychics. Please release as soon as you know you won't be able to complete it.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="messaging">
              <AccordionTrigger className="text-sm hover:no-underline">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  Messaging
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pl-7 space-y-2">
                <p>
                  Each request has a built-in message thread on its detail page. Use it to ask questions, get clarification, or discuss feedback with the admin team.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="deadlines" className="border-b-0">
              <AccordionTrigger className="text-sm hover:no-underline">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  Deadlines
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pl-7 space-y-2">
                <p>
                  Each claimed request shows a deadline on its card. Approaching deadlines appear in red. If you need more time, message the admin team.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Status Reference - compact */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Status Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2.5">
              <Badge variant="outline" className="shrink-0 text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">Available</Badge>
              <span className="text-muted-foreground text-xs">Open for any psychic to claim</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Badge variant="outline" className="shrink-0 text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">Claimed</Badge>
              <span className="text-muted-foreground text-xs">Assigned to you — upload your video</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Badge variant="outline" className="shrink-0 text-xs bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800">Submitted</Badge>
              <span className="text-muted-foreground text-xs">Under admin review</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Badge variant="outline" className="shrink-0 text-xs bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800">Revision Requested</Badge>
              <span className="text-muted-foreground text-xs">Needs changes — check feedback</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Badge variant="outline" className="shrink-0 text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">Approved</Badge>
              <span className="text-muted-foreground text-xs">Video accepted</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Badge variant="outline" className="shrink-0 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">Paid</Badge>
              <span className="text-muted-foreground text-xs">Payment processed</span>
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
