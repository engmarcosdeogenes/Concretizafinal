import { Sidebar } from "@/components/layout/Sidebar"
import { Navbar } from "@/components/layout/Navbar"
import { PushRegistrar } from "@/components/shared/PushRegistrar"
import { SidebarProvider } from "@/contexts/sidebar-context"
import { Toaster } from "sonner"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
        <Toaster position="top-right" richColors closeButton />
        <PushRegistrar />
      </div>
    </SidebarProvider>
  )
}
