import { Terminal } from "@/components/terminal";
import { SystemDashboard } from "@/components/system-dashboard";

export default function Home() {
  return (
    <div className="flex h-dvh overflow-hidden">
      <div className="flex-1 min-w-0">
        <Terminal />
      </div>
      <SystemDashboard />
    </div>
  );
}
