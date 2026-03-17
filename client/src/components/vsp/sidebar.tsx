import { useState } from "react";
import { Link } from "wouter";
import { ChevronDown, ChevronRight, Video, History, Calendar, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentHistoryDialog } from "./content-history-dialog";
import { useQuery } from "@tanstack/react-query";
import type { VspContentProject as ContentProject, VspContentCategory as ContentCategory, VspContentSubtopic as ContentSubtopic } from "@shared/schema";

// Local interfaces for transformed data
interface Topic {
  id: string;
  name: string;
  icon: string;
  color: string;
  subtopics: Subtopic[];
}

interface Subtopic {
  id: string;
  name: string;
}

interface SidebarProps {
  selectedTopic: string | null;
  onTopicSelect: (categoryId: string, subtopicId: string, subtopicName: string) => void;
  onProjectLoad?: (project: ContentProject) => void;
}

export function Sidebar({ selectedTopic, onTopicSelect, onProjectLoad }: SidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["mental-health"]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch categories and subtopics from API
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<ContentCategory[]>({
    queryKey: ["/api/vsp/admin/content-categories"],
    retry: false,
  });

  const { data: subtopics = [], isLoading: subtopicsLoading } = useQuery<ContentSubtopic[]>({
    queryKey: ["/api/vsp/admin/content-subtopics"],
    retry: false,
  });

  // Transform API data into Topic format
  const topics: Topic[] = categories
    .filter(category => category.isActive)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map(category => ({
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      subtopics: subtopics
        .filter(subtopic => subtopic.categoryId === category.id && subtopic.isActive)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map(subtopic => ({
          id: subtopic.id,
          name: subtopic.name,
        }))
    }));

  const isLoading = categoriesLoading || subtopicsLoading;

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <aside className="w-80 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
            <Video className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Viral Creator</h1>
            <p className="text-sm text-muted-foreground">AI Content Studio</p>
          </div>
        </div>
      </div>

      {/* Topic Categories */}
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Content Categories
        </h2>

        {isLoading ? (
          <div className="space-y-2">
            <div className="animate-pulse">
              <div className="h-12 bg-muted rounded-lg mb-2"></div>
              <div className="h-10 bg-muted/50 rounded-md mb-1 ml-4"></div>
              <div className="h-10 bg-muted/50 rounded-md mb-1 ml-4"></div>
              <div className="h-12 bg-muted rounded-lg mb-2"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {topics.map((topic: Topic) => (
            <div key={topic.id} className="category-group">
              <Button
                variant="ghost"
                className="w-full justify-between p-3 h-auto"
                onClick={() => toggleCategory(topic.id)}
                data-testid={`button-category-${topic.id}`}
              >
                <div className="flex items-center space-x-3">
                  <i className={`${topic.icon} ${topic.color}`} />
                  <span className="font-medium text-left">{topic.name}</span>
                </div>
                {expandedCategories.includes(topic.id) ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>

              {expandedCategories.includes(topic.id) && (
                <div className="ml-6 mt-2 space-y-1">
                  {(topic.subtopics || []).map((subtopic: Subtopic) => (
                    <Button
                      key={subtopic.id}
                      variant="ghost"
                      size="sm"
                      className={`w-full justify-start p-2 text-sm transition-colors ${
                        selectedTopic === subtopic.id
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                      onClick={() => onTopicSelect(topic.id, subtopic.id, subtopic.name)}
                      data-testid={`button-subtopic-${subtopic.id}`}
                    >
                      {subtopic.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <Link href="/calendar">
          <Button
            variant="outline"
            className="w-full justify-center space-x-2"
            data-testid="button-calendar"
          >
            <Calendar className="w-4 h-4" />
            <span>Content Calendar</span>
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-center space-x-2 text-muted-foreground hover:text-foreground"
          onClick={() => setShowHistory(true)}
          data-testid="button-content-history"
        >
          <History className="w-4 h-4" />
          <span>Quick History</span>
        </Button>
        <Link href="/history">
          <Button
            variant="outline"
            className="w-full justify-center space-x-2"
            data-testid="button-full-history"
          >
            <History className="w-4 h-4" />
            <span>Full History</span>
          </Button>
        </Link>
        <Link href="/settings">
          <Button
            variant="outline"
            className="w-full justify-center space-x-2"
            data-testid="button-settings-panel"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Button>
        </Link>
      </div>

      {/* Content History Dialog */}
      <ContentHistoryDialog
        open={showHistory}
        onOpenChange={setShowHistory}
        onProjectSelect={onProjectLoad}
      />
    </aside>
  );
}
