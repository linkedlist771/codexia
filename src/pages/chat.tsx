import { ChatView } from "@/components/ChatView";
import { NotesView } from "@/components/NotesView";
import { useLayoutStore } from "@/stores/layoutStore";
import { useFolderStore } from "@/stores/FolderStore";
import { FileTree } from "@/components/filetree/FileTreeView";
import { FileTreeItem } from "@/components/filetree/FileTreeItem";
import { FileViewer } from "@/components/filetree/FileViewer";
import { useNoteStore } from "@/stores/NoteStore";
import { GitStatusView } from "@/components/filetree/GitStatusView";
import { DiffViewer } from "@/components/filetree/DiffViewer";
import { useState } from "react";
import { ConfigDialog } from "@/components/dialogs/ConfigDialog";
import { AppToolbar } from "@/components/layout/AppToolbar";
import { useConversationStore } from "@/stores/ConversationStore";
import { useCodexStore } from "@/stores/CodexStore";
import { useChatInputStore } from "@/stores/chatInputStore";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { invoke } from "@tauri-apps/api/core";
import { GitBranch, Files, Bot, NotebookPen, Image } from "lucide-react";
import { NoteList } from "@/components/notes";
import { WebPreview } from "@/components/WebPreview";

export default function ChatPage() {
  const {
    showChatPane,
    showFileTree,
    showFilePanel,
    showWebPreview,
    selectedFile,
    selectedLeftPanelTab,
    webPreviewUrl,
    openFile,
    closeFile,
    setSelectedLeftPanelTab,
    setWebPreviewUrl,
    diffFile,
    setDiffFile,
    closeDiffFile,
  } = useLayoutStore();

  const { config, setConfig } = useCodexStore();
  const {} = useConversationStore();

  const { currentFolder } = useFolderStore();
  const { fileReferences, removeFileReference } = useChatInputStore();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [expandedAddedFolders, setExpandedAddedFolders] = useState<Set<string>>(
    new Set(),
  );

  const handleToggleAddedFolder = (folderPath: string) => {
    setExpandedAddedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  // Check if a file should show remove button (only if it's in the original fileReferences list)
  const shouldShowRemoveButton = (filePath: string) => {
    return fileReferences.some((ref) => ref.path === filePath);
  };

  const handleDiffClick = async (filePath: string) => {
    try {
      console.log("handleDiffClick called with:", filePath);
      console.log("currentFolder:", currentFolder);

      // Try with currentFolder first, then fallback to direct path
      const fullPath = currentFolder
        ? `${currentFolder}/${filePath}`
        : filePath;
      console.log("Trying full path:", fullPath);

      const result = await invoke<{
        original_content: string;
        current_content: string;
        has_changes: boolean;
      }>("get_git_file_diff", {
        filePath: fullPath,
      });

      if (result.has_changes) {
        // Clear selected file to avoid conflicts
        closeFile();
        // Set diff file and ensure panel is visible
        setDiffFile({
          original: result.original_content,
          current: result.current_content,
          fileName: filePath,
        });
      }
    } catch (error) {
      console.error("Failed to get diff:", error);
      console.error(
        "Tried path:",
        currentFolder ? `${currentFolder}/${filePath}` : filePath,
      );
    }
  };

  // No auto-initialization - let user start conversations manually

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left Panel - File Tree and Git Status */}
      {showFileTree && (
        <div className="w-64 border-r h-full flex-shrink-0">
          <Tabs value={selectedLeftPanelTab} onValueChange={setSelectedLeftPanelTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="files">文件</TabsTrigger>
              <TabsTrigger value="git">
                <GitBranch />
              </TabsTrigger>
              <TabsTrigger value="attached">
                <Files />
              </TabsTrigger>
              <TabsTrigger value="chat">
                <Bot />
              </TabsTrigger>
              <TabsTrigger value="notes">
                <NotebookPen />
              </TabsTrigger>
              <TabsTrigger value="image">
                <Image />
              </TabsTrigger>
            </TabsList>
            <TabsContent value="files" className="flex-1 overflow-hidden mt-0">
              <FileTree
                currentFolder={currentFolder || undefined}
                onFileClick={(path) => {
                  console.log("ChatPage: opening file from FileTree", path);
                  closeDiffFile(); // Clear any existing diff view
                  openFile(path);
                }}
              />
            </TabsContent>
            <TabsContent value="git" className="flex-1 overflow-hidden mt-0">
              <GitStatusView
                currentFolder={currentFolder || undefined}
                onDiffClick={handleDiffClick}
              />
            </TabsContent>
            <TabsContent
              value="attached"
              className="flex-1 overflow-hidden mt-0"
            >
              <div className="h-full overflow-auto p-2">
                {fileReferences.length === 0 ? (
                  <div className="text-center text-muted-foreground mt-8">
                    <Files size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">尚未添加文件</p>
                    <p className="text-xs mt-1">可在“文件”标签中添加</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    <div className="text-xs text-muted-foreground mb-2 px-2">
                      已添加 {fileReferences.length} 个文件到聊天
                    </div>
                    {fileReferences.map((ref) => (
                      <FileTreeItem
                        key={ref.path}
                        entry={{
                          name: ref.name,
                          path: ref.path,
                          is_directory: ref.isDirectory,
                        }}
                        level={0}
                        expandedFolders={expandedAddedFolders}
                        onToggleFolder={handleToggleAddedFolder}
                        onAddToChat={(path) =>
                          console.log("Added to chat:", path)
                        }
                        onFileClick={(path, isDirectory) => {
                          if (!isDirectory) {
                            closeDiffFile();
                            openFile(path);
                          }
                        }}
                        onSetWorkingFolder={() => {}}
                        onCalculateTokens={async () => null}
                        isFiltered={() => false}
                        showAddButton={true}
                        onRemoveFromChat={(path) => removeFileReference(path)}
                        preventFileReplace={true}
                        shouldShowRemoveButton={shouldShowRemoveButton}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="chat" className="flex-1 overflow-y-auto mt-0">
              <ChatView showChatTabs={true} />
            </TabsContent>
            <TabsContent value="notes">
              <NoteList />
            </TabsContent>
            <TabsContent value="image" className="px-2">
              在这里创建你的第一张图片或视频
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 h-full flex min-w-0 overflow-hidden">
        {/* Middle Panel - Chat/Notes */}
        {showChatPane &&
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <AppToolbar
              onOpenConfig={() => setIsConfigOpen(true)}
              currentTab={selectedLeftPanelTab}
              onSwitchToTab={setSelectedLeftPanelTab}
            />
            {selectedLeftPanelTab === "notes" ? (
              <NotesView />
            ) : (
              <ChatView />
            )}
          </div>
        }

        {/* Right Panel - FileViewer, DiffViewer, or WebPreview */}
        {((showFilePanel && selectedFile) || diffFile || (showWebPreview && webPreviewUrl)) && (
          <div className="flex-1 min-w-0 border-r overflow-hidden">
            {diffFile ? (
              <div className="h-full flex flex-col">
                <div className="p-2 border-b bg-muted/50 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    差异：{diffFile.fileName}
                  </span>
                  <button
                    onClick={() => closeDiffFile()}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </div>
                <DiffViewer
                  original={diffFile.original}
                  current={diffFile.current}
                  fileName={diffFile.fileName}
                />
              </div>
            ) : showWebPreview && webPreviewUrl ? (
              <WebPreview
                url={webPreviewUrl}
                onClose={() => setWebPreviewUrl(null)}
                onUrlChange={(url) => setWebPreviewUrl(url)}
              />
            ) : selectedFile ? (
              <FileViewer 
                filePath={selectedFile} 
                onClose={closeFile} 
                addToNotepad={(content: string, source?: string) => {
                  const { getCurrentNote, addContentToNote, createNoteFromContent } = useNoteStore.getState();
                  const currentNote = getCurrentNote();
                  
                  if (currentNote) {
                    addContentToNote(currentNote.id, content, source);
                  } else {
                    createNoteFromContent(content, source);
                  }
                }}
              />
            ) : null}
          </div>
        )}
      </div>

      <ConfigDialog
        isOpen={isConfigOpen}
        config={config}
        onClose={() => setIsConfigOpen(false)}
        onSave={(newConfig) => {
          setConfig(newConfig);
        }}
      />
    </div>
  );
}
