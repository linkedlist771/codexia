import { Button } from "@/components/ui/button";

interface SettingsSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function SettingsSidebar({ 
  activeSection, 
  onSectionChange 
}: SettingsSidebarProps) {
  return (
    <div className="w-64 border-r bg-muted/30 px-4 space-y-2">
      <Button
        variant={activeSection === "provider" ? "default" : "ghost"}
        className="w-full justify-start"
        onClick={() => onSectionChange("provider")}
      >
        模型提供商
      </Button>
      <Button
        variant={activeSection === "security" ? "default" : "ghost"}
        className="w-full justify-start"
        onClick={() => onSectionChange("security")}
      >
        安全
      </Button>
      <Button
        variant={activeSection === "working" ? "default" : "ghost"}
        className="w-full justify-start"
        onClick={() => onSectionChange("working")}
      >
        工作目录
      </Button>
      <Button
        variant={activeSection === "exclude" ? "default" : "ghost"}
        className="w-full justify-start"
        onClick={() => onSectionChange("exclude")}
      >
        排除的文件夹
      </Button>
      <Button
        variant={activeSection === "logo" ? "default" : "ghost"}
        className="w-full justify-start"
        onClick={() => onSectionChange("logo")}
      >
        Logo 设置
      </Button>
    </div>
  );
}
