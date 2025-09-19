import React, { useState, useEffect, useMemo } from "react";
import { ChatInterface } from "./chat/ChatInterface";
import { ConversationTabs } from "@/components/chat/ConversationTabs";
import { useConversationStore } from "@/stores/ConversationStore";
import type { Conversation } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { ConversationCategoryDialog } from "@/components/chat/ConversationCategoryDialog";
import { ResumeSessionsDialog } from "@/components/chat/ResumeSessionsDialog";
import { invoke } from "@tauri-apps/api/core";
import { useFolderStore } from "@/stores/FolderStore";

interface ChatViewProps {
  selectedConversation?: Conversation | null;
  showChatTabs?: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({ selectedConversation, showChatTabs = false }) => {
  const {
    currentConversationId,
    getCurrentProjectConversations,
    deleteConversation,
    setCurrentConversation,
    selectHistoryConversation,
    pendingNewConversation,
    toggleFavorite,
    categories,
    selectedCategoryId,
    addCategory,
    deleteCategory,
    setSelectedCategory,
  } = useConversationStore();
  
  // Get conversations filtered by current project
  const activeConversations = getCurrentProjectConversations();

  const [searchQuery, setSearchQuery] = useState("");
  const [internalSelectedConversation, setInternalSelectedConversation] = useState<Conversation | null>(null);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [resumeCandidates, setResumeCandidates] = useState<Conversation[]>([]);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeOnlyProject, setResumeOnlyProject] = useState(true);
  const [categoryOpen, setCategoryOpen] = useState(false);

  // Generate favorite statuses from the persisted store data
  const favoriteStatuses = useMemo(() => {
    const statuses: Record<string, boolean> = {};
    activeConversations.forEach(conv => {
      statuses[conv.id] = conv.isFavorite || false;
    });
    return statuses;
  }, [activeConversations]);

  const handleConversationSelect = (conversation: Conversation) => {
    const conversationCopy = { ...conversation };
    setInternalSelectedConversation(conversationCopy);
    console.log("🔄 ChatView: Calling selectHistoryConversation", conversation.id);
    selectHistoryConversation(conversationCopy);
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentConversation(sessionId);
  };

  const handleDeleteConversation = async (
    conversationId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    try {
      deleteConversation(conversationId);
    } catch (error) {
      console.error("Failed to delete conversation and session file:", error);
    }
  };

  const handleToggleFavorite = async (
    conversationId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    try {
      // Use the store's toggleFavorite method directly for persistence
      toggleFavorite(conversationId);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  // Clear selected conversation when starting a new conversation
  useEffect(() => {
    if (pendingNewConversation) {
      setInternalSelectedConversation(null);
    }
  }, [pendingNewConversation]);

  // Also clear when currentConversationId changes to a new codex-event format (from toolbar button)
  useEffect(() => {
    if (currentConversationId && currentConversationId.startsWith('codex-event-')) {
      // Check if this is a new conversation (no messages)
      const currentConv = activeConversations.find(conv => conv.id === currentConversationId);
      if (currentConv && currentConv.messages.length === 0) {
        setInternalSelectedConversation(null);
      }
    }
  }, [currentConversationId, activeConversations]);

  // Use either the passed selectedConversation or internal one
  const displayedConversation = selectedConversation || internalSelectedConversation;

  if (showChatTabs) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setCategoryOpen(true)}>
              分类：{selectedCategoryId ? (categories.find(c => c.id === selectedCategoryId)?.name || "未知") : "全部"}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  setResumeLoading(true);
                  const list = (await invoke<Conversation[]>("load_sessions_from_disk")) || [];
                  console.log("[Resume] loaded sessions from disk:", list.length, list);
                  const normalize = (p?: string | null) => {
                    if (!p) return p || '';
                    return p.endsWith('/') ? p.slice(0, -1) : p;
                  };
                  const project = normalize(useFolderStore.getState().currentFolder || '');
                  console.log("[Resume] current project:", project);
                  const annotated = list.map((c) => ({
                    id: c.id,
                    title: c.title,
                    filePath: (c as any).filePath,
                    projectRealpath: (c as any).projectRealpath,
                  }));
                  console.log("[Resume] candidates (id,title,file,project):", annotated);
                  const filtered = resumeOnlyProject && project
                    ? list.filter((c) => {
                        const pr = normalize((c as any).projectRealpath || '');
                        const match = pr === project;
                        if (!match) {
                          console.log("[Resume] filtered out (project mismatch)", { id: c.id, pr, project });
                        }
                        return match;
                      })
                    : list;
                  console.log("[Resume] filtered count:", filtered.length);
                  setResumeCandidates(filtered);
                  setResumeOpen(true);
                } catch (e) {
                  console.error("Failed to load sessions:", e);
                } finally {
                  setResumeLoading(false);
                }
              }}
            >
              {resumeLoading ? "加载中…" : "恢复…"}
            </Button>
          </div>
        </div>
        <ConversationTabs
          favoriteStatuses={favoriteStatuses}
          activeConversations={activeConversations}
          currentConversationId={currentConversationId}
          activeSessionId={currentConversationId || ''}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectConversation={handleConversationSelect}
          onToggleFavorite={handleToggleFavorite}
          onDeleteConversation={handleDeleteConversation}
          onSelectSession={handleSelectSession}
        />

        {/* Category selection & management */}
        <ConversationCategoryDialog
          open={categoryOpen}
          onOpenChange={setCategoryOpen}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategory}
          onAddCategory={addCategory}
          onDeleteCategory={deleteCategory}
        />

        <ResumeSessionsDialog
          open={resumeOpen}
          onOpenChange={setResumeOpen}
          candidates={resumeCandidates}
          setCandidates={setResumeCandidates}
          resumeOnlyProject={resumeOnlyProject}
          setResumeOnlyProject={setResumeOnlyProject}
          onResumeConversation={handleConversationSelect}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 h-full min-w-0">
      <ChatInterface
        sessionId={currentConversationId || ''}
        selectedConversation={displayedConversation}
      />
    </div>
  );
};
