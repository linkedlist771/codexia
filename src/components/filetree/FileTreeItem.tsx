import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Plus,
  ChevronRight,
  ChevronDown,
  FolderCheck,
  X,
} from "lucide-react";
import { getFileIcon } from "./FileIcons";
import { SubFolderContent } from "./SubFolderContent";
import { useChatInputStore } from "@/stores/chatInputStore";
import { useFolderStore } from "@/stores/FolderStore";
import { isMediaFile, createMediaAttachment } from "@/utils/mediaUtils";

interface FileEntry {
  name: string;
  path: string;
  is_directory: boolean;
  size?: number;
  extension?: string;
}

interface FileTreeItemProps {
  entry: FileEntry;
  level?: number;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  onAddToChat: (path: string) => void;
  onFileClick: (path: string, isDirectory: boolean) => void;
  onSetWorkingFolder: (path: string) => void;
  onCalculateTokens: (path: string) => Promise<number | null>;
  isFiltered: (entry: FileEntry) => boolean;
  showAddButton?: boolean;
  onRemoveFromChat?: (path: string) => void;
  disableSubFolderExpansion?: boolean;
  preventFileReplace?: boolean;
  shouldShowRemoveButton?: (path: string) => boolean;
  refreshKeyMap?: Record<string, number>;
}

export function FileTreeItem({
  entry,
  level = 0,
  expandedFolders,
  onToggleFolder,
  onAddToChat,
  onFileClick,
  onSetWorkingFolder,
  onCalculateTokens,
  isFiltered,
  showAddButton = true,
  onRemoveFromChat,
  preventFileReplace = false,
  shouldShowRemoveButton,
  refreshKeyMap,
}: FileTreeItemProps) {
  const [tokens, setTokens] = useState<number | null>(null);
  const [loadingTokens, setLoadingTokens] = useState(false);
  
  const { addFileReference, replaceFileReferences, addMediaAttachment } = useChatInputStore();
  const { currentFolder } = useFolderStore();

  const getRelativePath = (fullPath: string): string => {
    if (!currentFolder) return fullPath;
    
    // Remove current folder path to get relative path
    if (fullPath.startsWith(currentFolder)) {
      const relativePath = fullPath.slice(currentFolder.length);
      // Handle both Unix (/) and Windows (\) path separators
      return (relativePath.startsWith('/') || relativePath.startsWith('\\')) 
        ? relativePath.slice(1) 
        : relativePath;
    }
    return fullPath;
  };

  const handleAddToChatInput = async () => {
    const relativePath = getRelativePath(entry.path);
    
    // If it's a media file, add to media attachments
    if (!entry.is_directory && isMediaFile(entry.name)) {
      try {
        const mediaAttachment = await createMediaAttachment(entry.path);
        addMediaAttachment(mediaAttachment);
      } catch (error) {
        console.error('Failed to create media attachment:', error);
        // Fallback: still add as file reference
        addFileReference(entry.path, relativePath, entry.name, entry.is_directory);
      }
    } else {
      // Regular file or directory, add to file references
      addFileReference(entry.path, relativePath, entry.name, entry.is_directory);
    }
    
    if (onAddToChat) {
      onAddToChat(entry.path);
    }
  };

  const handleFileClickWithInput = () => {
    if (entry.is_directory) {
      onToggleFolder(entry.path);
    } else {
      // Only replace file references if not prevented (e.g., in regular Files tab)
      if (!preventFileReplace) {
        const relativePath = getRelativePath(entry.path);
        replaceFileReferences([{
          path: entry.path,
          relativePath,
          name: entry.name,
          isDirectory: entry.is_directory
        }]);
      }
      
      onFileClick(entry.path, entry.is_directory);
    }
  };

  const handleMouseEnter = async () => {
    if (!entry.is_directory && tokens === null && !loadingTokens) {
      setLoadingTokens(true);
      const calculatedTokens = await onCalculateTokens(entry.path);
      setTokens(calculatedTokens);
      setLoadingTokens(false);
    }
  };

  const handleCopyRelativePath = async () => {
    const relativePath = getRelativePath(entry.path);
    try {
      await navigator.clipboard.writeText(relativePath);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (isFiltered(entry)) return null;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="group"
          style={{ paddingLeft: `${level * 4}px` }}
          onMouseEnter={handleMouseEnter}
        >
          <div className="flex items-center gap-0.5 py-1 px-1 hover:bg-accent rounded">
            {entry.is_directory && (
              <Button
                variant="ghost"
                size="icon"
                className="p-0.5 w-4 h-4"
                onClick={() => onToggleFolder(entry.path)}
              >
                {expandedFolders.has(entry.path) ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </Button>
            )}

            {getFileIcon(entry)}

            <span
              className="flex-1 text-sm cursor-pointer hover:text-primary"
              onClick={handleFileClickWithInput}
            >
              {entry.name}
            </span>

            {tokens !== null && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="text-xs">
                      {tokens}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tokens} 个 tokens</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {entry.is_directory && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 p-0.5 w-4 h-4 h-auto"
                      onClick={() => onSetWorkingFolder(entry.path)}
                    >
                      <FolderCheck className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>设为工作目录</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <div className="flex items-center">
              {showAddButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 h-auto p-0.5 w-4 h-4"
                  onClick={handleAddToChatInput}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              )}
              {onRemoveFromChat && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 h-auto p-0.5 w-4 h-4 text-destructive hover:text-destructive/80"
                  onClick={() => onRemoveFromChat(entry.path)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>

          {entry.is_directory && expandedFolders.has(entry.path) && (
            <SubFolderContent
              folderPath={entry.path}
              level={level + 1}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              onAddToChat={onAddToChat}
              onFileClick={onFileClick}
              onSetWorkingFolder={onSetWorkingFolder}
              onCalculateTokens={onCalculateTokens}
              isFiltered={isFiltered}
              showAddButton={showAddButton}
              onRemoveFromChat={onRemoveFromChat}
              preventFileReplace={preventFileReplace}
              shouldShowRemoveButton={shouldShowRemoveButton}
              refreshKey={refreshKeyMap ? (refreshKeyMap[entry.path] || 0) : 0}
              refreshKeyMap={refreshKeyMap}
            />
          )}
        </div>
      </ContextMenuTrigger>
      
      <ContextMenuContent>
        <ContextMenuItem onClick={handleCopyRelativePath}>
          复制相对路径
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
