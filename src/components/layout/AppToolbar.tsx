import React from "react";
import { Button } from "../ui/button";
import {
  Settings,
  PencilIcon,
  History,
  Globe,
} from "lucide-react";
import { useConversationStore } from "@/stores/ConversationStore";
import { useEphemeralStore } from "@/stores/EphemeralStore";
import { useNoteStore } from "@/stores/NoteStore";
import { useLayoutStore } from "@/stores/layoutStore";
import { useFolderStore } from "@/stores/FolderStore";
import { detectWebFramework } from "@/utils/webFrameworkDetection";
import { useChatInputStore } from "@/stores/chatInputStore";

interface AppToolbarProps {
  onOpenConfig: () => void;
  onCreateNewSession?: () => void;
  currentTab?: string;
  onSwitchToTab?: (tab: string) => void;
}

export const AppToolbar: React.FC<AppToolbarProps> = ({
  onOpenConfig,
  onCreateNewSession,
  currentTab,
  onSwitchToTab,
}) => {
  const { setPendingNewConversation, setCurrentConversation, currentConversationId } =
    useConversationStore();
  const { createNote, setCurrentNote } = useNoteStore();
  const { showWebPreview, setWebPreviewUrl } = useLayoutStore();
  const { currentFolder } = useFolderStore();
  const { requestFocus } = useChatInputStore();

  const handleToggleLeftPanel = () => {
    if (!onSwitchToTab) return;
    
    if (currentTab === "notes") {
      // Switch to notes tab in left panel
      onSwitchToTab("notes");
    } else {
      // Switch to chat tab in left panel for conversation management
      onSwitchToTab("chat");
    }
  };

  const handleCreateNote = () => {
    const newNote = createNote();
    setCurrentNote(newNote.id);
  };

  const handleCreateConversation = () => {
    // Clear any per-turn diffs (parsedFiles) from the current session
    try {
      const activeId = currentConversationId || "";
      if (activeId) {
        useEphemeralStore.getState().clearTurnDiffs(activeId);
      }
    } catch (e) {
      console.error('Failed to clear turn diffs on new conversation:', e);
    }

    if (onCreateNewSession) {
      // Use the callback for full session creation if provided
      onCreateNewSession();
    } else {
      // Set pending state to prepare for new conversation
      setPendingNewConversation(true);
      // Clear current conversation to show new chat interface
      // The actual session ID will be created when user sends first message
      setCurrentConversation('');
    }
    // After creating/selecting a new conversation, focus the chat input
    requestFocus();
  };

  const handleToggleWebPreview = async () => {
    if (showWebPreview) {
      setWebPreviewUrl(null);
    } else {
      let defaultUrl = 'http://localhost:3000';
      
      // Try to detect web framework and use appropriate URL
      if (currentFolder) {
        try {
          const frameworkInfo = await detectWebFramework(currentFolder);
          if (frameworkInfo) {
            defaultUrl = frameworkInfo.devUrl;
          }
        } catch (error) {
          console.error('Failed to detect web framework:', error);
        }
      }
      
      setWebPreviewUrl(defaultUrl);
    }
  };

  const PanelToggleButton = () => (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0"
      onClick={handleToggleLeftPanel}
      title="切换面板"
    >
      <History />
    </Button>
  );

  return (
    <div className="flex items-center justify-end gap-2">

      {currentTab !== "notes" && (
        <>
          {/* Create Conversation Button */}
          <Button
            onClick={handleCreateConversation}
            variant="ghost"
            size="icon"
            className="h-7 w-7 p-0"
            title="新建会话"
          >
            <PencilIcon />
          </Button>

          <PanelToggleButton />

          {/* Web Preview Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleWebPreview}
            className={`h-7 w-7 shrink-0 ${showWebPreview ? 'bg-accent' : ''}`}
            title="切换网页预览"
          >
            <Globe />
          </Button>

          {/* Settings Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenConfig}
            className="h-7 w-7 shrink-0"
            title="配置设置"
          >
            <Settings />
          </Button>
        </>
      )}

      {currentTab === "notes" && (
        <>
          <Button
            onClick={handleCreateNote}
            size="icon"
            className="h-7 w-7 p-0"
            title="新建便笺"
          >
            <PencilIcon className="h-3 w-3" />
          </Button>
          <PanelToggleButton />
        </>
      )}
    </div>
  );
};
