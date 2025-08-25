import * as React from "react";
import { Dumbbell } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarRail } from "@/components/ui/sidebar";
import { NavLink } from "react-router-dom";
import { useLocation } from "react-router-dom";

const data = {
  navMain: [
    {
      title: "Profile",
      to: "/profile",
      items: [
        { title: "Settings", to: "/profile/settings" },
      ],
    },
    {
      title: "Nutrition",
      to: "/nutrition",
      items: [
        { title: "Add food", to: "/nutrition/add" },
        { title: "History", to: "/nutrition/history" },
      ],
    },
    {
      title: "Fitness Assistant",
      to: "/chat",
      items: [
        { title: "New Chat", to: "/chat/new" },
      ],
    },
    {
      title: "Workouts",
      to: "/workouts",
      items: [
        { title: "Push Day", to: "/workouts/push" },
      ],
    },
    {
      title: "Resources",
      to: "/resources",
      items: [
        { title: "Fitness", to: "/resources/fitness" },
        { title: "Nutrition", to: "/resources/fitness" },
        { title: "Recovery", to: "/resources/fitness" },
      ],
    },
  ],
}

export function AppSidebar({
  ...props
}) {
  const location = useLocation();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div
                  className="bg-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Dumbbell />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-bold text-primary text-lg">PrimeDFit</span>
                  <span className="text-gray-600 text-xs">A.I Fitness Center</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>

            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={location.pathname === item.to}>
                  <NavLink
                    to={item.to}
                    className="font-bold"
                  >
                    {item.title}
                  </NavLink>
                </SidebarMenuButton>

                {/* {item.items?.length ? (
                  <SidebarMenuSub>
                    {item.items.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild isActive={location.pathname === item.to}>
                          <a href={item.url}>{item.title}</a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null} */}

              </SidebarMenuItem>
            ))}

          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar >
  );
}
