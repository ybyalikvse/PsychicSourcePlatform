import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Eye, Hash, Video, Play, Trash2, Calendar, Filter } from "lucide-react";
import type { VspContentProject as ContentProject } from "@shared/schema";

export default function HistoryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  // Fetch all projects
  const { data: projects, isLoading } = useQuery({
    queryKey: ["/api/vsp/projects"],
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await apiRequest("DELETE", `/api/vsp/projects/${projectId}`);
      if (!response.ok) throw new Error("Failed to delete project");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vsp/projects"] });
      toast({
        title: "Project Deleted",
        description: "Project has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter projects based on selected filter
  const projectsArray = Array.isArray(projects) ? projects : [];
  const filteredProjects = projectsArray.filter((project: ContentProject) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "completed") return project.videoUrl;
    if (selectedFilter === "scripts") return project.script;
    if (selectedFilter === "drafts") return !project.script;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "video_generating": return "bg-blue-100 text-blue-800 border-blue-200";
      case "caption_generated": return "bg-purple-100 text-purple-800 border-purple-200";
      case "script_generated": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Complete";
      case "video_generating": return "Generating Video";
      case "caption_generated": return "Caption Ready";
      case "script_generated": return "Script Ready";
      default: return "Draft";
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Unknown";
    const d = new Date(date);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      deleteProjectMutation.mutate(projectId);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="button-back-home">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Creator
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Content History</h1>
                <p className="text-muted-foreground">Browse and manage all your created content</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All Projects", count: projectsArray.length },
              { key: "completed", label: "Completed", count: projectsArray.filter((p: ContentProject) => p.videoUrl).length },
              { key: "scripts", label: "With Scripts", count: projectsArray.filter((p: ContentProject) => p.script).length },
              { key: "drafts", label: "Drafts", count: projectsArray.filter((p: ContentProject) => !p.script).length },
            ].map((filter) => (
              <Button
                key={filter.key}
                variant={selectedFilter === filter.key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter(filter.key)}
                data-testid={`button-filter-${filter.key}`}
              >
                {filter.label} ({filter.count})
              </Button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full mb-4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project: ContentProject) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow" data-testid={`card-project-${project.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{project.subtopic}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">
                        {project.category.replace("-", " ")}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(project.status)}
                      data-testid={`badge-status-${project.id}`}
                    >
                      {getStatusText(project.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(project.updatedAt)}</span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress indicators */}
                    <div className="flex items-center justify-between text-sm">
                      <div className={`flex items-center space-x-1 ${
                        project.script ? "text-green-600" : "text-muted-foreground"
                      }`}>
                        <Eye className="w-4 h-4" />
                        <span>Script</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${
                        project.caption ? "text-green-600" : "text-muted-foreground"
                      }`}>
                        <Hash className="w-4 h-4" />
                        <span>Caption</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${
                        project.videoUrl ? "text-green-600" : "text-muted-foreground"
                      }`}>
                        <Video className="w-4 h-4" />
                        <span>Video</span>
                      </div>
                    </div>

                    {/* Content preview */}
                    {project.script && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Script Preview</p>
                        <p className="text-sm line-clamp-3">{project.script.content}</p>
                      </div>
                    )}
                    
                    {project.caption && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Caption Preview</p>
                        <p className="text-sm line-clamp-2">{project.caption.text}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.caption.hashtags.slice(0, 3).map((hashtag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              #{hashtag}
                            </Badge>
                          ))}
                          {project.caption.hashtags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{project.caption.hashtags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-2">
                      <Link href={`/?projectId=${project.id}`}>
                        <Button size="sm" data-testid={`button-open-${project.id}`}>
                          <Play className="w-4 h-4 mr-1" />
                          Open
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteProject(project.id)}
                        disabled={deleteProjectMutation.isPending}
                        data-testid={`button-delete-${project.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Projects Found</h3>
            <p className="text-muted-foreground mb-4">
              {selectedFilter === "all" 
                ? "You haven't created any content projects yet." 
                : `No projects match the "${selectedFilter}" filter.`}
            </p>
            <Link href="/">
              <Button data-testid="button-create-first">
                Create Your First Project
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}