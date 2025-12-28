import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { IntegrationCard } from "@/components/integration-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Search, Zap, CheckCircle, XCircle, Link2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Integration } from "@shared/schema";

export default function Integrations() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  
  // Handle OAuth callback messages
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const success = params.get("success");
    const error = params.get("error");
    
    if (success) {
      toast({
        title: "Connected",
        description: decodeURIComponent(success.replace(/\+/g, " ")),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      setLocation("/integrations", { replace: true });
    }
    
    if (error) {
      toast({
        title: "Connection Failed",
        description: decodeURIComponent(error.replace(/\+/g, " ")),
        variant: "destructive",
      });
      setLocation("/integrations", { replace: true });
    }
  }, [searchString, toast, setLocation]);

  const { data: integrations = [] } = useQuery<Integration[]>({
    queryKey: ["/api/integrations"],
  });

  const getIntegrationStatus = (name: string): "connected" | "disconnected" | "error" => {
    const integration = integrations.find((i) => i.name === name);
    return (integration?.status as "connected" | "disconnected" | "error") || "disconnected";
  };

  const getLastSync = (name: string): string | undefined => {
    const integration = integrations.find((i) => i.name === name);
    return integration?.lastSync || undefined;
  };

  const syncMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("POST", `/api/integrations/${name}/sync`);
    },
    onSuccess: (_, name) => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({
        title: "Sync complete",
        description: `${name} data has been updated.`,
      });
    },
    onError: (_, name) => {
      toast({
        title: "Sync failed",
        description: `Could not sync ${name}. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const connectMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", `/api/integrations/${name}/connect`);
      return await response.json();
    },
    onSuccess: (data, name) => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      if (data?.requiresOAuth && data?.authUrl) {
        // Redirect to OAuth in same window for GSC
        window.location.href = data.authUrl;
      } else {
        toast({
          title: "Connected",
          description: data?.message || `${name} has been connected successfully.`,
        });
      }
    },
    onError: (error: any, name) => {
      toast({
        title: "Connection failed",
        description: error?.message || `Could not connect ${name}. Please check your API keys.`,
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("POST", `/api/integrations/${name}/disconnect`);
    },
    onSuccess: (_, name) => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({
        title: "Disconnected",
        description: `${name} has been disconnected.`,
      });
    },
  });

  const integrationsList = [
    {
      name: "Ahrefs",
      key: "ahrefs",
      description: "SEO metrics, keyword research, and AI content optimization",
      icon: <Link2 className="h-5 w-5" />,
    },
    {
      name: "Google Search Console",
      key: "gsc",
      description: "Keyword rankings, clicks, impressions, and search performance",
      icon: <Search className="h-5 w-5" />,
    },
    {
      name: "Google Analytics",
      key: "ga",
      description: "Website traffic, user behavior, and engagement metrics",
      icon: <BarChart3 className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-6" data-testid="page-integrations">
      <div>
        <h1 className="text-2xl font-semibold">Integrations</h1>
        <p className="text-muted-foreground">
          Connect your SEO and analytics tools
        </p>
      </div>

      <div className="grid gap-4">
        {integrationsList.map((integration) => (
          <IntegrationCard
            key={integration.key}
            name={integration.name}
            description={integration.description}
            icon={integration.icon}
            status={getIntegrationStatus(integration.key)}
            lastSync={getLastSync(integration.key)}
            onConnect={() => connectMutation.mutate(integration.key)}
            onDisconnect={() => disconnectMutation.mutate(integration.key)}
            onSync={() => syncMutation.mutate(integration.key)}
            isSyncing={syncMutation.isPending && syncMutation.variables === integration.key}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            API Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">Ahrefs API</span>
              </div>
              {getIntegrationStatus("ahrefs") === "connected" ? (
                <Badge variant="outline" className="text-green-600 dark:text-green-400">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Key Configured
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  <XCircle className="mr-1 h-3 w-3" />
                  Not Configured
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">Google Search Console</span>
              </div>
              <Badge variant="outline" className="text-green-600 dark:text-green-400">
                <CheckCircle className="mr-1 h-3 w-3" />
                OAuth Configured
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">Google Analytics</span>
              </div>
              <Badge variant="outline" className="text-green-600 dark:text-green-400">
                <CheckCircle className="mr-1 h-3 w-3" />
                Measurement ID Set
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
