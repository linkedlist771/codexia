import React, { useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { ArrowUp, Square, AudioLines, Globe } from 'lucide-react';
import { useChatInputStore } from '@/stores/chatInputStore';
import { MediaSelector } from './MediaSelector';
import { FileReferenceList } from './FileReferenceList';
import { MediaAttachmentList } from './MediaAttachmentList';
import { useSettingsStore } from '@/stores/SettingsStore';
import { ScreenshotPopover } from './ScreenshotPopover';
import { useCodexStore } from '@/stores/CodexStore';

interface ChatInputProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: (message: string) => void;
  onStopStreaming?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholderOverride?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputValue,
  onInputChange,
  onSendMessage,
  onStopStreaming,
  disabled = false,
  isLoading = false,
  placeholderOverride,
}) => {
  const {
    fileReferences,
    mediaAttachments,
    removeFileReference,
    removeMediaAttachment,
    clearFileReferences,
    clearMediaAttachments,
    focusSignal,
  } = useChatInputStore();
  const { windowTitle } = useSettingsStore()
  const { config, updateConfig } = useCodexStore();

  // Ref for the textarea to allow programmatic focus
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Focus textarea when a focus is requested (signal increments)
  useEffect(() => {
    if (textareaRef.current) {
      // Slight delay to ensure UI updates (e.g., new conversation selection)
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [focusSignal]);

  const generateSmartPrompt = (): string => {
    if (fileReferences.length === 0) return '';
    return fileReferences.map(ref => ref.relativePath).join(' ');
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || isLoading) return;

    // Build message content with file references
    let messageContent = inputValue;
    if (fileReferences.length > 0) {
      const smartPrompt = generateSmartPrompt();
      messageContent = `${smartPrompt}\n\n${inputValue}`;
    }

    // NEW: Include image paths directly in the text message for view_image tool
    if (mediaAttachments.length > 0) {
      const imagePaths = mediaAttachments
        .filter(media => media.type === 'image')
        .map(media => media.path)
        .join(' ');
      
      if (imagePaths) {
        messageContent = `${messageContent}\n\n${imagePaths}`;
      }
      
      console.log("📸 Including image paths in text:", imagePaths);
    }

    // Send as simple text message - Agent will use view_image tool automatically
    console.log("📤 ChatInput: Sending text message with image paths:", messageContent);
    
    onSendMessage(messageContent);
    onInputChange('');
    clearFileReferences();
    clearMediaAttachments();
  };

  const handleStopStreaming = () => {
    if (onStopStreaming) {
      onStopStreaming();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // allow newline
        return;
      } else {
        e.preventDefault();
        handleSendMessage();
      }
    }
  };

  return (
    <div className="flex-shrink-0 border-t px-4 bg-background">
      <div className="relative">
        {/* File references and media attachments inside textarea */}
        {(fileReferences.length > 0 || mediaAttachments.length > 0) && (
          <div className="absolute top-2 left-3 right-32 z-10 flex flex-wrap gap-1 items-center mb-2 max-h-20 overflow-y-auto">
            {/* File references */}
            <FileReferenceList 
              fileReferences={fileReferences}
              onRemove={removeFileReference}
            />
            
            {/* Media attachments */}
            <MediaAttachmentList
              mediaAttachments={mediaAttachments}
              onRemove={removeMediaAttachment}
            />
          </div>
        )}
        
        <Textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={placeholderOverride || `向${windowTitle == 'Codexia' ? "Codex" : windowTitle} 提问，或让它帮你做事`}
          className={`min-h-20 max-h-96 pr-32 bg-muted/50 resize-none overflow-y-auto pb-8 ${
            (fileReferences.length > 0 || mediaAttachments.length > 0) ? 'pt-8' : ''
          }`}
          disabled={false}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = '60px';
            const newHeight = Math.min(target.scrollHeight, 200);
            target.style.height = newHeight + 'px';
          }}
        />
        
        {/* Media Selector and Screenshot Selector - bottom left inside textarea */}
        <div className="flex absolute left-2 bottom-2 items-center gap-1">
          <MediaSelector />
          <ScreenshotPopover onScreenshotTaken={(path) => {
            onInputChange(inputValue + (inputValue ? '\n\n' : '') + path);
          }} />
          {/* Web search toggle */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-6 px-1 py-0 hover:bg-muted/50 ${config.webSearchEnabled ? 'text-blue-500' : 'text-muted-foreground'}`}
            onClick={() => updateConfig({ webSearchEnabled: !config.webSearchEnabled })}
            title={config.webSearchEnabled ? '已启用网页搜索' : '启用网页搜索'}
          >
            <Globe className="h-4 w-4" />
            {config.webSearchEnabled && (
              <span className="ml-1 text-xs">搜索</span>
            )}
          </Button>
        </div>

        {/* Model Selector and Send Button - bottom right inside textarea */}
        <div className="absolute right-4 bottom-2 flex items-center gap-1">
          {isLoading ? (
            <Button
              onClick={handleStopStreaming}
              size="icon"
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground h-8 w-8 p-0"
              variant="default"
            >
              <Square className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || disabled}
              size="icon"
              className="rounded-full w-6 h-6"
            >
              {inputValue.trim() ? <ArrowUp /> : <AudioLines />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
