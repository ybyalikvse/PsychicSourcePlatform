import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Clock, Save, Share, Calendar, TrendingUp } from "lucide-react";
import { Sidebar } from "@/components/vsp/sidebar";
import { WorkflowCards } from "@/components/vsp/workflow-cards";
import { ContentDisplay } from "@/components/vsp/content-display";
import type { VspContentProject as ContentProject } from "@shared/schema";

export default function ContentCreator() {
  const [location, setLocation] = useLocation();
  // Check if URL has a project ID: /vsp/:projectId
  const [, routeParams] = useRoute("/vsp/:projectId");
  const urlProjectId = routeParams?.projectId || null;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [selectedTopicName, setSelectedTopicName] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(urlProjectId);

  // Sync URL project ID to state
  useEffect(() => {
    if (urlProjectId && urlProjectId !== currentProjectId) {
      setCurrentProjectId(urlProjectId);
    }
  }, [urlProjectId]);

  // Update URL when project changes
  useEffect(() => {
    if (currentProjectId && location !== `/vsp/${currentProjectId}`) {
      setLocation(`/vsp/${currentProjectId}`, { replace: true });
    } else if (!currentProjectId && location !== '/vsp') {
      setLocation('/vsp', { replace: true });
    }
  }, [currentProjectId]);

  // Get all projects for loading by ID
  const { data: projects } = useQuery({
    queryKey: ["/api/vsp/projects"],
  });

  // Get current project by ID from cache/API
  const { data: currentProject } = useQuery<ContentProject>({
    queryKey: ["/api/vsp/projects", currentProjectId],
    enabled: !!currentProjectId,
  });

  const handleTopicSelect = (categoryId: string, subtopicId: string, subtopicName: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubtopic(subtopicId);
    setSelectedTopicName(subtopicName);
    setCurrentProjectId(null); // Reset current project when topic changes
  };

  const handleProjectUpdate = (project: ContentProject) => {
    setCurrentProjectId(project.id);
  };

  const qc = useQueryClient();

  const handleProjectLoad = (project: ContentProject) => {
    // Pre-populate the query cache so the project is immediately available
    qc.setQueryData(["/api/vsp/projects", project.id], project);
    setCurrentProjectId(project.id);
    // Extract category and subtopic info from the project
    setSelectedCategory(project.category);
    setSelectedSubtopic(project.subtopic);
    setSelectedTopicName((project.subtopic || 'custom').split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '));
  };

  // Load project from URL on first render
  useEffect(() => {
    if (urlProjectId && projects && Array.isArray(projects)) {
      const project = projects.find((p: ContentProject) => p.id === urlProjectId);
      if (project) {
        handleProjectLoad(project);
      }
    }
  }, [urlProjectId, projects]);

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar
        selectedTopic={selectedSubtopic}
        onTopicSelect={handleTopicSelect}
        onProjectLoad={handleProjectLoad}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <header className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground" data-testid="text-selected-topic">
                {selectedTopicName || "Select a Topic"}
              </h2>
              <p className="text-muted-foreground">Generate viral TikTok/Reel scripts for your content</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Last updated: {currentProject ? '2 minutes ago' : 'Never'}</span>
              </div>
              <Button data-testid="button-new-script">
                <Plus className="w-4 h-4 mr-2" />
                New Script
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Workflow Steps */}
            <WorkflowCards
              selectedCategory={selectedCategory}
              selectedSubtopic={selectedSubtopic}
              currentProject={currentProject || null}
              onProjectUpdate={handleProjectUpdate}
            />

            {/* Generated Content Display */}
            <ContentDisplay project={currentProject || null} onProjectUpdate={handleProjectUpdate} />

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="flex flex-col items-center p-4 h-auto space-y-2"
                  data-testid="button-schedule-post"
                >
                  <Calendar className="w-6 h-6 text-orange-500" />
                  <span className="text-sm font-medium">Schedule Post</span>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
