import * as React from "react";
import { Dumbbell } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarRail } from "@/components/ui/sidebar";
import { NavLink } from "react-router-dom";

const data = {
  navMain: [
    {
      title: "Profile",
      to: "/",
      items: [
        {
          title: "Settings",
          to: "/",
          isActive: true
        },
      ],
    },
    {
      title: "Nutrition",
      to: "/nutrition",
      items: [
        {
          title: "Add food",
          url: "/nutrition",
        },
        {
          title: "History",
          url: "/nutrition",
        },
      ],
    },
    {
      title: "Fitness Assistant",
      to: "/chat",
      items: [
        {
          title: "New Chat",
          url: "#",
        },
      ],
    },
    {
      title: "Workouts",
      to: "/workouts",
      items: [
        {
          title: "Push Day",
          url: "/workouts",
        },
      ],
    },
    {
      title: "Resources",
      to: "/resources",
      items: [
        {
          title: "Fitness",
          to: "/resources",
        },
        {
          title: "Nutrition",
          to: "/resources",
        },
        {
          title: "Recovery",
          to: "/resources",
        },
      ],
    },
  ],
}

export function AppSidebar({
  ...props
}) {
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
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.to}
                    className="font-bold"
                  >
                    {item.title}
                  </NavLink>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub>
                    {item.items.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild isActive={item.isActive}>
                          <a href={item.url}>{item.title}</a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar >
  );
}
