import { Link, useLocation } from "wouter";
import logoPath from "@assets/psychicsource-logo-nobg.png";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  Zap,
  TrendingUp,
  Wand2,
  Target,
  Layers,
  Link as LinkIcon,
  Star,
  Users,
  Video,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Content",
    url: "/content",
    icon: FileText,
  },
  {
    title: "Create with AI",
    url: "/create",
    icon: Wand2,
  },
  {
    title: "Bulk Create",
    url: "/bulk-create",
    icon: Layers,
  },
  {
    title: "Optimize",
    url: "/optimize",
    icon: Target,
  },
  {
    title: "Internal Links",
    url: "/internal-links",
    icon: LinkIcon,
  },
  {
    title: "Horoscopes",
    url: "/horoscopes",
    icon: Star,
  },
];

const videoNavItems = [
  {
    title: "Psychics",
    url: "/psychics",
    icon: Users,
  },
  {
    title: "Video Requests",
    url: "/video-requests",
    icon: Video,
  },
];

const seoNavItems = [
  {
    title: "Performance",
    url: "/performance",
    icon: TrendingUp,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
];

const systemNavItems = [
  {
    title: "Integrations",
    url: "/integrations",
    icon: Zap,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img src={logoPath} alt="Psychic Source" className="h-10 object-contain" data-testid="img-sidebar-logo" />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Video Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {videoNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>SEO & Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {seoNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
          <div className="flex-1">
            <p className="text-xs font-medium">API Status</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <span className="mr-1 h-2 w-2 rounded-full bg-green-500 inline-block" />
                Connected
              </Badge>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
