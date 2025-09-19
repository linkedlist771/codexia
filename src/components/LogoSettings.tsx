import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { useSettingsStore } from "@/stores/SettingsStore";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { getCurrentWindow } from '@tauri-apps/api/window';

export default function LogoSettings() {
  const { logoSettings, setUseCustomLogo, setCustomLogoPath, setWindowTitle } =
    useSettingsStore();
    const windowTitle = useSettingsStore(state => state.windowTitle);

    useEffect(() => {
      const updateWindowTitle = async () => {
        const window = getCurrentWindow();
        await window.setTitle(windowTitle);
      };
    
      updateWindowTitle();
    }, [windowTitle]);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async () => {
    try {
      setUploading(true);

      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Image",
            extensions: ["png", "jpg", "jpeg", "gif", "svg", "webp"],
          },
        ],
      });

      if (selected && typeof selected === "string") {
        // Read the file and convert to base64 data URL
        const fileContents = await readFile(selected);
        const blob = new Blob([fileContents]);
        const reader = new FileReader();

        reader.onload = () => {
          const dataUrl = reader.result as string;
          setCustomLogoPath(dataUrl);
          setUseCustomLogo(true);
        };

        reader.readAsDataURL(blob);
      }
    } catch (error) {
      console.error("Failed to upload logo:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleToggle = (checked: boolean) => {
    setUseCustomLogo(checked);
  };

  const clearLogo = () => {
    setCustomLogoPath("");
    setUseCustomLogo(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Logo 设置</h2>
        <p className="text-muted-foreground">
          自定义应用头部显示的 Logo
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logo 配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              id="window-title"
              placeholder="请输入窗口标题..."
              value={windowTitle}
              onChange={(e) => setWindowTitle(e.target.value)}
            />
          </div>
          <div className="flex space-x-2 mt-2">
            {["Codexia", "ChatGPT", "Grok"].map((example) => (
              <Button
                key={example}
                variant="outline"
                size="sm"
                onClick={() => {
                  setWindowTitle(example);
                }}
              >
                {example}
              </Button>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="use-custom-logo"
              checked={logoSettings.useCustomLogo}
              onCheckedChange={handleToggle}
            />
            <Label htmlFor="use-custom-logo">使用自定义 Logo</Label>
          </div>

          {logoSettings.useCustomLogo && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="logo-path">Logo 路径</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    id="logo-path"
                    value={logoSettings.customLogoPath}
                    placeholder="选择一个 Logo 文件..."
                    readOnly
                  />
                  <Button
                    onClick={handleFileUpload}
                    disabled={uploading}
                    variant="outline"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? "正在上传..." : "浏览"}
                  </Button>
                </div>
              </div>

              {logoSettings.customLogoPath && (
                <div className="space-y-2">
                  <Label>Logo 预览</Label>
                  <div className="flex items-center space-x-4">
                    <img
                      src={logoSettings.customLogoPath}
                      alt="自定义 Logo 预览"
                      className="h-8 w-auto object-contain border rounded"
                    />
                    <Button onClick={clearLogo} variant="destructive" size="sm">
                      移除 Logo
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
