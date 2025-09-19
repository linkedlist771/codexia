import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Plus, FileText } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { useNoteStore } from '../../stores/NoteStore';

interface MessageNoteActionsProps {
  messageId: string;
  messageContent: string;
  messageRole: string;
  timestamp: number;
  selectedText?: string;
}

export const MessageNoteActions: React.FC<MessageNoteActionsProps> = ({
  messageContent,
  messageRole,
  timestamp,
  selectedText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { notes, createNoteFromContent, addContentToNote, getCurrentNote } = useNoteStore();
  
  const activeNote = getCurrentNote();
  
  const formatMessageMetadata = (content: string) => {
    const date = new Date(timestamp);
    const timeStr = date.toLocaleString();
    const prefix = selectedText ? "所选文本" : "消息";
    const roleZh = messageRole === 'user' ? '用户' : messageRole === 'assistant' ? '助手' : messageRole === 'system' ? '系统' : '未知';
    const source = `${prefix}（来自${roleZh}）- ${timeStr}`;
    
    return {
      content,
      source,
    };
  };

  const handleAddToExistingNote = (noteId: string) => {
    const contentToAdd = selectedText || messageContent;
    const { content, source } = formatMessageMetadata(contentToAdd);
    addContentToNote(noteId, content, source);
    setIsOpen(false);
  };

  const handleCreateNewNote = () => {
    const contentToAdd = selectedText || messageContent;
    const { content, source } = formatMessageMetadata(contentToAdd);
    createNoteFromContent(content, source);
    setIsOpen(false);
  };

  const handleAddToCurrentNote = () => {
    if (activeNote) {
      handleAddToExistingNote(activeNote.id);
    }
  };

  return (
    <TooltipProvider>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <FileText className="h-3 w-3" />
              </TooltipTrigger>
              <TooltipContent>
                <p>添加到便笺</p>
              </TooltipContent>
            </Tooltip>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-64 p-2" align="end">
          <div className="space-y-2">
            <div className="text-sm font-medium px-2">添加到便笺</div>
            
            {/* Add to current note if one is active */}
            {activeNote && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8"
                onClick={handleAddToCurrentNote}
              >
                <FileText className="h-4 w-4 mr-2" />
                添加到“{activeNote.title}”
              </Button>
            )}
            
            {/* Create new note */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-8"
              onClick={handleCreateNewNote}
            >
              <Plus className="h-4 w-4 mr-2" />
              新建便笺
              </Button>
            
            {/* Add to existing note (show recent notes) */}
            {notes.length > 0 && activeNote && (
              <div className="border-t pt-2">
                <div className="text-xs text-gray-500 px-2 mb-1">最近的便笺</div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {notes
                    .filter(note => note.id !== activeNote?.id)
                    .slice(0, 5)
                    .map((note) => (
                      <Button
                        key={note.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-8 text-xs"
                        onClick={() => handleAddToExistingNote(note.id)}
                      >
                        <FileText className="h-3 w-3 mr-2" />
                        <span className="truncate">{note.title}</span>
                      </Button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
};
