import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus } from "lucide-react";
import { useSettingsStore } from "@/stores/SettingsStore";

export default function ExcludeFolders() {
  const [newFolder, setNewFolder] = useState("");
  const { excludeFolders, addExcludeFolder, removeExcludeFolder } = useSettingsStore();

  const handleAddFolder = () => {
    if (newFolder.trim() && !excludeFolders.includes(newFolder.trim())) {
      addExcludeFolder(newFolder.trim());
      setNewFolder("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddFolder();
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>排除的文件夹</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label htmlFor="new-folder" className="mb-1">
            添加需要排除的文件夹
          </Label>
          <Input
            id="new-folder"
            value={newFolder}
            onChange={(e) => setNewFolder(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="例如：.git、node_modules、dist"
          />
        </div>
        <Button 
          onClick={handleAddFolder} 
          disabled={!newFolder.trim() || excludeFolders.includes(newFolder.trim())}
          className="h-[38px]"
        >
          <Plus className="w-4 h-4 mr-2" />
          添加
        </Button>
      </div>
        
        <div>
          <Label>已排除的文件夹</Label>
          <div className="mt-2 space-y-2">
            {excludeFolders.map((folder) => (
              <div key={folder} className="flex items-center justify-between bg-muted rounded px-2">
                <span className="font-mono text-sm">{folder}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExcludeFolder(folder)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
