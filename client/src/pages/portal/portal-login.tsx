import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PortalLayout } from "@/components/portal-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Video } from "lucide-react";
import type { Psychic } from "@shared/schema";

interface PortalLoginProps {
  onLogin: (psychic: Psychic) => void;
}

export default function PortalLogin({ onLogin }: PortalLoginProps) {
  const [selectedId, setSelectedId] = useState<string>("");

  const { data: psychics, isLoading } = useQuery<Psychic[]>({
    queryKey: ["/api/psychics"],
  });

  const activePsychics = psychics?.filter((p) => p.status === "active") || [];

  const handleLogin = () => {
    const psychic = activePsychics.find((p) => p.id === selectedId);
    if (psychic) {
      onLogin(psychic);
    }
  };

  return (
    <PortalLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full p-3 bg-primary/10">
                <Video className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-xl" data-testid="text-portal-title">Psychic Video Portal</CardTitle>
            <CardDescription data-testid="text-portal-description">
              Select your profile to browse and fulfill video requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : activePsychics.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center" data-testid="text-no-psychics">
                No active psychics found. Please contact an administrator.
              </p>
            ) : (
              <>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger data-testid="select-psychic">
                    <SelectValue placeholder="Select your name" />
                  </SelectTrigger>
                  <SelectContent>
                    {activePsychics.map((p) => (
                      <SelectItem key={p.id} value={p.id} data-testid={`select-psychic-${p.id}`}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="w-full"
                  disabled={!selectedId}
                  onClick={handleLogin}
                  data-testid="button-portal-login"
                >
                  Continue
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
