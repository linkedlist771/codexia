import { useState } from "react";
import SettingsSidebar from "@/components/SettingsSidebar";
import ProviderList from "@/components/ProviderList";
import ProviderModels from "@/components/ProviderModels";
import ExcludeFolders from "@/components/ExcludeFolders";
import LogoSettings from "@/components/LogoSettings";
import { useSettingsStore } from "@/stores/SettingsStore";

export default function SettingsPage() {
  const { activeSection, setActiveSection } = useSettingsStore();
  const [selectedProvider, setSelectedProvider] = useState<string>("openai");
  const providerNames = [
    "openai",
    "google",
    "ollama",
    "openrouter",
    "xai"
  ];

  return (
    <div className="flex h-screen">
      <SettingsSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      <div className="flex-1 px-6 overflow-y-auto">
        {activeSection === "provider" && (
          <div className="grid grid-cols-3 gap-6">
            <ProviderList 
              providers={providerNames}
              selectedProvider={selectedProvider}
              onProviderSelect={setSelectedProvider}
            />
            <ProviderModels 
              selectedProvider={selectedProvider}
            />
          </div>
        )}
        {activeSection === "security" && <p>安全设置</p>}
        {activeSection === "working" && <p>工作目录设置</p>}
        {activeSection === "exclude" && <ExcludeFolders />}
        {activeSection === "logo" && <LogoSettings />}
      </div>
    </div>
  );
}
