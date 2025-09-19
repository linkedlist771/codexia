import { Copy, Check, GitFork, Pencil } from 'lucide-react';
import { useState } from 'react';
import { MessageNoteActions } from './MessageNoteActions';

interface MessageFooterProps {
  messageId: string;
  messageContent: string;
  messageRole: string;
  timestamp: number;
  selectedText: string;
  messageType?: 'reasoning' | 'tool_call' | 'plan_update' | 'exec_command' | 'normal';
  eventType?: string;
  onFork?: () => void;
  onEdit?: () => void;
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const MessageFooter = ({ 
  messageId, 
  messageContent, 
  messageRole, 
  timestamp, 
  selectedText,
  messageType,
  eventType,
  onFork,
  onEdit,
}: MessageFooterProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  return (
    <div
      className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
    >
      <div className="inline-flex items-center gap-1 text-[11px] bg-background/90 backdrop-blur-sm rounded-md border border-border/40 px-1.5 py-0.5 shadow-sm pointer-events-auto">
        <span className="text-[10px] text-muted-foreground">
          {formatTime(timestamp)}
        </span>
        {messageType && (
          <span className="text-[10px] px-1 py-0.5 rounded bg-accent/40 text-muted-foreground border border-border/40">
            {messageType}
          </span>
        )}
        {eventType && (
          <span className="text-[10px] px-1 py-0.5 rounded bg-accent/30 text-muted-foreground/80 border border-border/30">
            {eventType}
          </span>
        )}
        <div className="flex items-center gap-0.5 ml-1">
          {messageRole === 'user' && onEdit && (
            <button
              onClick={onEdit}
              className="p-1 hover:bg-accent rounded transition-colors"
              title="编辑此消息并从这里重新发送"
            >
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          {messageRole === 'assistant' && onFork && (
            <button
              onClick={onFork}
              className="p-1 hover:bg-accent rounded transition-colors"
              title="从此消息分叉新会话"
            >
              <GitFork className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-accent rounded transition-colors"
            title={copied ? "已复制！" : "复制消息"}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <MessageNoteActions
            messageId={messageId}
            messageContent={messageContent}
            messageRole={messageRole}
            timestamp={timestamp}
            selectedText={selectedText}
          />
        </div>
      </div>
    </div>
  );
};
