import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { IntegrationCard } from "@/components/integration-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, Search, Zap, CheckCircle, XCircle, Settings } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Integration } from "@shared/schema";

export default function Integrations() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [gaPropertyId, setGaPropertyId] = useState("");
  const [showPropertyIdInput, setShowPropertyIdInput] = useState(false);
  
  const { data: integrations = [] } = useQuery<Integration[]>({
    queryKey: ["/api/integrations"],
  });

  const getIntegration = (name: string): Integration | undefined => {
    return integrations.find((i) => i.name === name);
  };

  const getIntegrationStatus = (name: string): "connected" | "configured" | "disconnected" | "error" => {
    const integration = getIntegration(name);
    return (integration?.status as "connected" | "configured" | "disconnected" | "error") || "disconnected";
  };

  const getLastSync = (name: string): string | undefined => {
    const integration = getIntegration(name);
    return integration?.lastSync || undefined;
  };

  const gaIntegration = getIntegration("ga");
  const gaConfig = (gaIntegration?.config || {}) as { propertyId?: string };
  const gaPropertyIdSet = !!gaConfig.propertyId;

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const success = params.get("success");
    const error = params.get("error");
    const needsPropertyId = params.get("needsPropertyId");
    
    if (success) {
      toast({
        title: "Connected",
        description: decodeURIComponent(success.replace(/\+/g, " ")),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      
      if (needsPropertyId === "true") {
        setShowPropertyIdInput(true);
        toast({
          title: "Property ID Required",
          description: "Please enter your GA4 Property ID to complete the setup.",
        });
      }
      
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

  const savePropertyIdMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const response = await apiRequest("POST", "/api/integrations/ga/property", { propertyId });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      setShowPropertyIdInput(false);
      setGaPropertyId("");
      toast({
        title: "Property ID Saved",
        description: "Your GA4 Property ID has been saved. You can now view analytics data.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to save",
        description: "Could not save the Property ID. Please try again.",
        variant: "destructive",
      });
    },
  });

  const integrationsList = [
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

      {getIntegrationStatus("ga") === "connected" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Google Analytics Configuration
            </CardTitle>
            <CardDescription>
              {gaPropertyIdSet && !showPropertyIdInput
                ? `Connected to GA4 Property: ${gaConfig.propertyId}`
                : "Enter your GA4 Property ID to fetch analytics data. You can find this in Google Analytics under Admin > Property Settings."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(showPropertyIdInput || !gaPropertyIdSet) ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="propertyId" className="sr-only">GA4 Property ID</Label>
                    <Input
                      id="propertyId"
                      placeholder="e.g., 123456789"
                      value={gaPropertyId}
                      onChange={(e) => setGaPropertyId(e.target.value.replace(/\D/g, ""))}
                      data-testid="input-ga-property-id"
                    />
                  </div>
                  <Button
                    onClick={() => savePropertyIdMutation.mutate(gaPropertyId)}
                    disabled={!gaPropertyId || gaPropertyId.length < 6 || savePropertyIdMutation.isPending}
                    data-testid="button-save-property-id"
                  >
                    {savePropertyIdMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  {showPropertyIdInput && gaPropertyIdSet && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPropertyIdInput(false);
                        setGaPropertyId("");
                      }}
                      data-testid="button-cancel-property-id"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Property ID must be a numeric value (at least 6 digits)
                </p>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPropertyIdInput(true)}
                data-testid="button-change-property-id"
              >
                Change Property ID
              </Button>
            )}
          </CardContent>
        </Card>
      )}

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
                OAuth Configured
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
