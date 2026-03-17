import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, BarChart3, Target, Users, ArrowLeft, Home, Edit, Trash2, MoreHorizontal, Zap, Bot } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { VspCampaign as Campaign, VspContentCalendar as ContentCalendar, VspContentProject as ContentProject } from "@shared/schema";
import { CampaignTemplateDialog } from "@/components/vsp/campaign-template-dialog";
import { BulkGenerationDialog } from "@/components/vsp/bulk-generation-dialog";
import { CustomCampaignBuilder } from "@/components/vsp/custom-campaign-builder";
import { WeekView } from "@/components/vsp/week-view";
import { DayDetailDialog } from "@/components/vsp/day-detail-dialog";

// Calendar component for content marketing planning
export default function CalendarPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ContentCalendar | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [selectedCampaignForBulk, setSelectedCampaignForBulk] = useState<Campaign | null>(null);
  const [view, setView] = useState<'month' | 'week'>('month');

  // Get month range for calendar data
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = monthStart.toISOString().split('T')[0];
  const endDate = monthEnd.toISOString().split('T')[0];

  // Fetch calendar data
  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['/api/vsp/calendar', startDate, endDate],
    queryFn: async () => {
      const response = await fetch(`/api/vsp/calendar?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error('Failed to fetch calendar data');
      return response.json() as Promise<{ events: ContentCalendar[], projects: ContentProject[] }>;
    },
  });

  // Fetch campaigns
  const { data: campaigns = [] } = useQuery({
    queryKey: ['/api/vsp/campaigns'],
    retry: false,
  }) as { data: Campaign[] };

  // Calendar navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + (direction === 'next' ? 1 : -1), 1));
  };

  // Delete functions
  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => apiRequest('DELETE', `/api/vsp/campaigns/${campaignId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vsp/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vsp/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vsp/calendar'] });
      toast({ title: "Campaign deleted", description: "Campaign and all content removed successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete campaign", variant: "destructive" });
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => apiRequest('DELETE', `/api/vsp/calendar/${eventId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vsp/calendar'] });
      toast({ title: "Event deleted", description: "Calendar event has been removed successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete event", variant: "destructive" });
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => apiRequest('DELETE', `/api/vsp/projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vsp/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vsp/calendar'] });
      toast({ title: "Content deleted", description: "Content project has been removed successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete content project", variant: "destructive" });
    }
  });

  // Generate calendar grid
  const generateCalendarDays = () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startOfWeek = new Date(startOfMonth);
    startOfWeek.setDate(startOfMonth.getDate() - startOfMonth.getDay());
    
    const days = [];
    const currentDay = new Date(startOfWeek);
    
    for (let i = 0; i < 42; i++) { // 6 weeks
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const events = calendarData?.events.filter(event => event.scheduledDate === dateStr) || [];
    const projects = calendarData?.projects.filter(project => project.scheduledDate === dateStr) || [];
    return { events, projects };
  };

  // Get campaign for a project
  const getCampaignForProject = (project: any) => {
    return campaigns.find(c => c.id === project.campaignId);
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="outline" size="sm" data-testid="button-back-dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Content Calendar</h1>
            <p className="text-muted-foreground">Plan and schedule your content marketing campaigns</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowCampaignDialog(true)}
            data-testid="button-new-campaign"
          >
            <Target className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
          
          <Button
            onClick={() => setShowTemplateDialog(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            data-testid="button-campaign-templates"
          >
            <Zap className="h-4 w-4 mr-2" />
            AI Templates
          </Button>
          
          <Button
            onClick={() => {
              console.log("Custom Campaign button clicked, opening dialog...");
              setShowCustomBuilder(true);
            }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            data-testid="button-custom-campaign"
          >
            <Bot className="h-4 w-4 mr-2" />
            Custom AI Campaign
          </Button>
          
          <Button
            onClick={() => setShowEventDialog(true)}
            data-testid="button-new-event"
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Content
          </Button>
        </div>
      </div>

      {/* Calendar Navigation & View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={view === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('month')}
          >
            Month
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('week')}
          >
            Week
          </Button>
        </div>
      </div>

      {/* Active Campaigns Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {campaigns?.slice(0, 3).map((campaign: Campaign) => (
          <Card key={campaign.id} className="border-l-4" style={{ borderLeftColor: campaign.color || '#3b82f6' }}>
            <CardHeader className="pb-3 flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium">{campaign.name}</CardTitle>
                <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                  {campaign.status}
                </Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    setSelectedCampaignForBulk(campaign);
                    setShowBulkDialog(true);
                  }}>
                    <Bot className="h-4 w-4 mr-2" />
                    Bulk Generate Content
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setEditingCampaign(campaign);
                    setShowCampaignDialog(true);
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Campaign
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Campaign
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">{campaign.description}</p>
              <div className="flex justify-between text-xs">
                <span>{new Date(campaign.startDate).toLocaleDateString()}</span>
                <span>{new Date(campaign.endDate).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2" />
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-muted-foreground">Loading calendar...</div>
            </div>
          ) : view === 'month' ? (
            <div className="grid grid-cols-7 gap-px bg-border">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="bg-muted p-3 text-center text-sm font-medium">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((day, index) => {
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const isToday = day.toDateString() === new Date().toDateString();
                const dayEvents = getEventsForDate(day);
                const hasContent = dayEvents.events.length > 0 || dayEvents.projects.length > 0;
                
                return (
                  <div
                    key={index}
                    className={`
                      bg-background p-2 min-h-[100px] cursor-pointer hover:bg-muted/50 transition-colors
                      ${!isCurrentMonth ? 'opacity-50' : ''}
                      ${isToday ? 'ring-2 ring-primary' : ''}
                      ${hasContent ? 'bg-blue-50 dark:bg-blue-950/30' : ''}
                    `}
                    onClick={() => {
                      setSelectedDate(day.toISOString().split('T')[0]);
                      setShowDayDetail(true);
                    }}
                    data-testid={`calendar-day-${day.getDate()}`}
                  >
                    <div className="text-sm font-medium mb-1">{day.getDate()}</div>
                    
                    {/* Content indicators */}
                    <div className="space-y-1">
                      {dayEvents.events.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 py-0.5 rounded truncate cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 flex items-center justify-between group"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEvent(event);
                            setShowEventDialog(true);
                          }}
                        >
                          <span className="truncate">📅 {event.title}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 ml-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteEventMutation.mutate(event.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {dayEvents.projects.slice(0, 1).map(project => (
                        <div
                          key={project.id}
                          className="text-xs px-1 py-0.5 rounded truncate text-white"
                          style={{ backgroundColor: getCampaignForProject(project)?.color || '#10b981' }}
                        >
                          🎬 {getCampaignForProject(project)?.name || 'Campaign'}: {project.subtopic}
                        </div>
                      ))}
                      {(dayEvents.events.length + dayEvents.projects.length) > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{(dayEvents.events.length + dayEvents.projects.length) - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <WeekView 
              currentDate={currentDate}
              calendarData={calendarData}
              getEventsForDate={getEventsForDate}
              onDateClick={(date) => {
                setSelectedDate(date);
                setShowDayDetail(true);
              }}
              onEventClick={(event) => {
                setEditingEvent(event);
                setShowEventDialog(true);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calendarData?.events.length || 0}</div>
            <p className="text-xs text-muted-foreground">Planned content pieces</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(campaigns as Campaign[])?.filter((c: Campaign) => c.status === 'active').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Running campaigns</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calendarData?.projects.length || 0}</div>
            <p className="text-xs text-muted-foreground">Videos created</p>
          </CardContent>
        </Card>
      </div>

      {/* New Event Dialog */}
      <CreateEventDialog 
        open={showEventDialog}
        onOpenChange={(open) => {
          setShowEventDialog(open);
          if (!open) setEditingEvent(null);
        }}
        campaigns={campaigns}
        selectedDate={selectedDate}
        editingEvent={editingEvent}
      />

      {/* New Campaign Dialog */}
      <CreateCampaignDialog 
        open={showCampaignDialog}
        onOpenChange={(open) => {
          setShowCampaignDialog(open);
          if (!open) setEditingCampaign(null);
        }}
        editingCampaign={editingCampaign}
      />

      {/* Campaign Template Dialog */}
      <CampaignTemplateDialog 
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        onSuccess={(campaign) => {
          // Refresh data after successful campaign creation
          queryClient.invalidateQueries({ queryKey: ['/api/vsp/calendar', startDate, endDate] });
          queryClient.invalidateQueries({ queryKey: ['/api/vsp/campaigns'] });
        }}
      />

      {/* Bulk Generation Dialog */}
      <BulkGenerationDialog 
        open={showBulkDialog}
        onOpenChange={(open) => {
          setShowBulkDialog(open);
          if (!open) setSelectedCampaignForBulk(null);
        }}
        campaign={selectedCampaignForBulk}
      />

      {/* Custom Campaign Builder */}
      <CustomCampaignBuilder 
        open={showCustomBuilder}
        onOpenChange={setShowCustomBuilder}
        onSuccess={(campaign) => {
          // Refresh data after successful campaign creation
          queryClient.invalidateQueries({ queryKey: ['/api/vsp/calendar', startDate, endDate] });
          queryClient.invalidateQueries({ queryKey: ['/api/vsp/campaigns'] });
        }}
      />

      {/* Day Detail Dialog */}
      <DayDetailDialog 
        open={showDayDetail}
        onOpenChange={setShowDayDetail}
        selectedDate={selectedDate}
        calendarData={calendarData}
        getEventsForDate={getEventsForDate}
        onEventEdit={(event) => {
          setEditingEvent(event);
          setShowEventDialog(true);
          setShowDayDetail(false);
        }}
        onEventDelete={(eventId) => {
          deleteEventMutation.mutate(eventId);
          setShowDayDetail(false);
        }}
        onProjectEdit={(project) => {
          // Navigate to the main page with project ID
          window.location.href = `/?projectId=${project.id}`;
        }}
        onProjectDelete={(projectId) => {
          deleteProjectMutation.mutate(projectId);
          setShowDayDetail(false);
        }}
        onAddEvent={() => {
          setShowEventDialog(true);
          setShowDayDetail(false);
        }}
      />
    </div>
  );
}

// Create Event Dialog Component
function CreateEventDialog({ 
  open, 
  onOpenChange, 
  campaigns, 
  selectedDate,
  editingEvent
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  campaigns: Campaign[];
  selectedDate: string | null;
  editingEvent?: ContentCalendar | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: editingEvent?.title || '',
    description: editingEvent?.description || '',
    scheduledDate: editingEvent?.scheduledDate || selectedDate || new Date().toISOString().split('T')[0],
    category: editingEvent?.category || '',
    subtopic: editingEvent?.subtopic || '',
    campaignId: editingEvent?.campaignId || '',
    notes: editingEvent?.notes || ''
  });

  // Update form when editing event changes
  React.useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.title,
        description: editingEvent.description || '',
        scheduledDate: editingEvent.scheduledDate,
        category: editingEvent.category,
        subtopic: editingEvent.subtopic,
        campaignId: editingEvent.campaignId || '',
        notes: editingEvent.notes || ''
      });
    } else if (selectedDate) {
      setFormData({
        title: '',
        description: '',
        scheduledDate: selectedDate,
        category: '',
        subtopic: '',
        campaignId: '',
        notes: ''
      });
    }
  }, [editingEvent, selectedDate]);

  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingEvent) {
        return apiRequest('PUT', `/api/vsp/calendar/${editingEvent.id}`, data);
      } else {
        return apiRequest('POST', '/api/vsp/calendar', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vsp/calendar'] });
      toast({ 
        title: editingEvent ? "Event updated" : "Event scheduled", 
        description: editingEvent ? "Content event has been updated" : "Content event has been added to your calendar" 
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: editingEvent ? "Failed to update event" : "Failed to schedule event", 
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEventMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingEvent ? 'Edit Content Event' : 'Schedule New Content'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Content Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Love & Relationships Video"
              required
              data-testid="input-event-title"
            />
          </div>
          
          <div>
            <Label htmlFor="scheduledDate">Scheduled Date</Label>
            <Input
              id="scheduledDate"
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              required
              data-testid="input-event-date"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger data-testid="select-event-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Love/Relationships">Love/Relationships</SelectItem>
                  <SelectItem value="Career/Finance">Career/Finance</SelectItem>
                  <SelectItem value="Health/Wellness">Health/Wellness</SelectItem>
                  <SelectItem value="Mental Health">Mental Health</SelectItem>
                  <SelectItem value="Family/Parenting">Family/Parenting</SelectItem>
                  <SelectItem value="Life Transitions">Life Transitions</SelectItem>
                  <SelectItem value="Loss & Grieving">Loss & Grieving</SelectItem>
                  <SelectItem value="Life Meaning">Life Meaning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="subtopic">Subtopic</Label>
              <Input
                id="subtopic"
                value={formData.subtopic}
                onChange={(e) => setFormData({ ...formData, subtopic: e.target.value })}
                placeholder="Specific topic"
                required
                data-testid="input-event-subtopic"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="campaignId">Campaign (Optional)</Label>
            <Select
              value={formData.campaignId}
              onValueChange={(value) => setFormData({ ...formData, campaignId: value })}
            >
              <SelectTrigger data-testid="select-event-campaign">
                <SelectValue placeholder="Select campaign" />
              </SelectTrigger>
              <SelectContent>
                {campaigns?.map((campaign: Campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Content description or brief..."
              rows={3}
              data-testid="textarea-event-description"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes or ideas..."
              rows={2}
              data-testid="textarea-event-notes"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createEventMutation.isPending} data-testid="button-save-event">
              {createEventMutation.isPending 
                ? (editingEvent ? 'Updating...' : 'Scheduling...') 
                : (editingEvent ? 'Update Event' : 'Schedule Content')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Create Campaign Dialog Component
function CreateCampaignDialog({ 
  open, 
  onOpenChange,
  editingCampaign
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  editingCampaign?: Campaign | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: editingCampaign?.name || '',
    description: editingCampaign?.description || '',
    startDate: editingCampaign?.startDate || new Date().toISOString().split('T')[0],
    endDate: editingCampaign?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    color: editingCampaign?.color || '#3b82f6',
    goals: editingCampaign?.goals || {
      targetViews: 0,
      targetEngagement: 0,
      platforms: [] as string[],
      objectives: [] as string[]
    }
  });

  // Update form when editing campaign changes
  React.useEffect(() => {
    if (editingCampaign) {
      setFormData({
        name: editingCampaign.name,
        description: editingCampaign.description || '',
        startDate: editingCampaign.startDate,
        endDate: editingCampaign.endDate,
        color: editingCampaign.color || '#3b82f6',
        goals: editingCampaign.goals || {
          targetViews: 0,
          targetEngagement: 0,
          platforms: [],
          objectives: []
        }
      });
    } else {
      setFormData({
        name: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        color: '#3b82f6',
        goals: {
          targetViews: 0,
          targetEngagement: 0,
          platforms: [],
          objectives: []
        }
      });
    }
  }, [editingCampaign]);

  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingCampaign) {
        return apiRequest('PUT', `/api/vsp/campaigns/${editingCampaign.id}`, data);
      } else {
        return apiRequest('POST', '/api/vsp/campaigns', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vsp/campaigns'] });
      toast({ 
        title: editingCampaign ? "Campaign updated" : "Campaign created", 
        description: editingCampaign ? "Campaign has been updated successfully" : "New marketing campaign has been created" 
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: editingCampaign ? "Failed to update campaign" : "Failed to create campaign", 
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCampaignMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="campaignName">Campaign Name</Label>
            <Input
              id="campaignName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Summer Love Series, Mental Health Awareness"
              required
              data-testid="input-campaign-name"
            />
          </div>
          
          <div>
            <Label htmlFor="campaignDescription">Description</Label>
            <Textarea
              id="campaignDescription"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the campaign goals and theme..."
              rows={3}
              data-testid="textarea-campaign-description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                data-testid="input-campaign-start"
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                data-testid="input-campaign-end"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="campaignColor">Campaign Color</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="campaignColor"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-9"
                data-testid="input-campaign-color"
              />
              <span className="text-sm text-muted-foreground">Used for calendar visualization</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetViews">Target Views</Label>
              <Input
                id="targetViews"
                type="number"
                value={formData.goals.targetViews}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  goals: { ...formData.goals, targetViews: parseInt(e.target.value) || 0 }
                })}
                placeholder="100000"
                data-testid="input-campaign-views"
              />
            </div>
            
            <div>
              <Label htmlFor="targetEngagement">Target Engagement %</Label>
              <Input
                id="targetEngagement"
                type="number"
                value={formData.goals.targetEngagement}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  goals: { ...formData.goals, targetEngagement: parseInt(e.target.value) || 0 }
                })}
                placeholder="5"
                data-testid="input-campaign-engagement"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCampaignMutation.isPending} data-testid="button-save-campaign">
              {createCampaignMutation.isPending 
                ? (editingCampaign ? 'Updating...' : 'Creating...') 
                : (editingCampaign ? 'Update Campaign' : 'Create Campaign')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}