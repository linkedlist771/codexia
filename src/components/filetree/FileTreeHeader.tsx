import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, RefreshCw, Search } from "lucide-react";
import { useState } from "react";

interface FileTreeHeaderProps {
  currentFolder?: string;
  filterText: string;
  onFilterTextChange: (text: string) => void;
  showFilter: boolean;
  onToggleFilter: () => void;
  onRefresh: () => void;
  excludeFolders: string[];
}

export function FileTreeHeader({
  currentFolder,
  filterText,
  onFilterTextChange,
  onRefresh,
}: FileTreeHeaderProps) {
  const [showSearchInput, setShowSearchInput] = useState(false);
  const getCurrentDirectoryName = () => {
    if (!currentFolder) return "主页";
    return currentFolder.split("/").pop() || currentFolder;
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1">
          <Folder className="w-4 h-4 text-blue-500" />
          <span
            className="text-sm font-medium text-gray-700 truncate"
            title={currentFolder || "主页"}
          >
            {getCurrentDirectoryName()}
          </span>
        </div>

        <span className="flex gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onRefresh}
            title="刷新目录"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setShowSearchInput(!showSearchInput)}
          >
            <Search className="w-3 h-3" />
          </Button>
        </span>
      </div>

      {showSearchInput &&
        <Input
          placeholder="搜索文件或文件夹..."
          value={filterText}
          onChange={(e) => onFilterTextChange(e.target.value)}
          className="text-sm"
        />
      }
    </div>
  );
}
