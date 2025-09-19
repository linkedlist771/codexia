import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Conversation } from "@/types/chat";
import { invoke } from "@tauri-apps/api/core";
import { useFolderStore } from "@/stores/FolderStore";

interface ResumeSessionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: Conversation[];
  setCandidates: React.Dispatch<React.SetStateAction<Conversation[]>>;
  resumeOnlyProject: boolean;
  setResumeOnlyProject: React.Dispatch<React.SetStateAction<boolean>>;
  onResumeConversation: (conversation: Conversation) => void;
}

const getFilePath = (conversation: Conversation): string | undefined => {
  return (conversation as unknown as { filePath?: string }).filePath;
};

export const ResumeSessionsDialog: React.FC<ResumeSessionsDialogProps> = ({
  open,
  onOpenChange,
  candidates,
  setCandidates,
  resumeOnlyProject,
  setResumeOnlyProject,
  onResumeConversation,
}) => {
  const currentProject = useFolderStore((state) => state.currentFolder);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<Record<string, boolean>>({});
  const selectedCount = useMemo(
    () => Object.values(selectedPaths).filter(Boolean).length,
    [selectedPaths],
  );

  useEffect(() => {
    if (!open) {
      setSelectMode(false);
      setSelectedPaths({});
    }
  }, [open]);

  const handleSelectModeChange = (enabled: boolean) => {
    setSelectMode(enabled);
    if (!enabled) {
      setSelectedPaths({});
    }
  };

  const handleToggleCandidate = (filePath: string) => {
    setSelectedPaths((prev) => ({ ...prev, [filePath]: !prev[filePath] }));
  };

  const handleSelectAll = () => {
    if (candidates.length === 0) return;
    const next: Record<string, boolean> = {};
    for (const conversation of candidates) {
      const filePath = getFilePath(conversation);
      if (filePath) {
        next[filePath] = true;
      }
    }
    setSelectedPaths(next);
  };

  const handleDeleteSelected = async () => {
    const paths = candidates
      .map((conversation) => getFilePath(conversation))
      .filter((filePath): filePath is string => Boolean(filePath))
      .filter((filePath) => Boolean(selectedPaths[filePath]));

    if (paths.length === 0) {
      return;
    }

    try {
      await Promise.all(
        paths.map((filePath) =>
          invoke("delete_session_file", { filePath }).catch((error) => {
            console.error("Failed to delete session file:", filePath, error);
          }),
        ),
      );
      const removal = new Set(paths);
      setCandidates((prev) =>
        prev.filter((candidate) => {
          const filePath = getFilePath(candidate);
          return filePath ? !removal.has(filePath) : true;
        }),
      );
      setSelectedPaths({});
      handleSelectModeChange(false);
    } catch (error) {
      console.error("Bulk delete failed:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>恢复历史会话</DialogTitle>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={selectMode}
                  onChange={(event) => handleSelectModeChange(event.target.checked)}
                />
                多选模式
              </label>
              {selectMode && (
                <>
                  <Button size="sm" variant="outline" onClick={handleSelectAll}>
                    全选
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={selectedCount === 0}
                    onClick={handleDeleteSelected}
                  >
                    删除（{selectedCount}）
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            当前项目：{currentProject || "（无）"}
          </div>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto divide-y rounded border">
          {candidates.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              暂无可恢复的会话{resumeOnlyProject ? "（当前项目）" : ""}。
              {resumeOnlyProject && (
                <button
                  className="ml-2 underline hover:no-underline"
                  onClick={() => setResumeOnlyProject(false)}
                >
                  显示全部
                </button>
              )}
            </div>
          ) : (
            candidates.map((conversation) => {
              const filePath = getFilePath(conversation);
              const isSelected = filePath ? Boolean(selectedPaths[filePath]) : false;
              return (
                <div
                  key={conversation.id + (filePath || "")}
                  className={`w-full text-left p-3 hover:bg-accent flex items-center gap-3 ${isSelected ? "bg-accent/50" : ""}`}
                  onClick={() => {
                    if (selectMode) {
                      if (!filePath) return;
                      handleToggleCandidate(filePath);
                      return;
                    }
                    onResumeConversation(conversation);
                    onOpenChange(false);
                  }}
                >
                  {selectMode && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(event) => {
                        event.stopPropagation();
                        if (!filePath) return;
                        const checked = event.target.checked;
                        setSelectedPaths((prev) => ({ ...prev, [filePath]: checked }));
                      }}
                      onClick={(event) => event.stopPropagation()}
                    />
                  )}
                  <div className="text-sm font-medium truncate">{conversation.title}</div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
