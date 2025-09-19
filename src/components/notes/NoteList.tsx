import { cn } from "@/lib/utils";
import { useNoteStore } from "@/stores/NoteStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Trash2, Search, Star, StarOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoteToChat } from "./NoteToChat";
import { useState, useMemo } from "react";

export function NoteList() {
  const {
    notes,
    currentNoteId,
    setCurrentNote,
    deleteNote,
    toggleFavorite,
  } = useNoteStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const handleDeleteNote = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNote(noteId);
  };
  
  const handleToggleFavorite = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(noteId);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  const filteredNotes = useMemo(() => {
    let filtered = notes;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
      );
    }
    
    // Filter by tab
    if (activeTab === "favorites") {
      filtered = filtered.filter(note => note.isFavorited);
    }
    
    return filtered;
  }, [notes, searchQuery, activeTab]);

  const renderNoteItem = (note: any) => (
    <div
      key={note.id}
      className={cn(
        "group relative p-3 rounded-lg cursor-pointer border transition-all hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm",
        currentNoteId === note.id
          ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 shadow-sm"
          : "bg-white dark:bg-gray-900 border-transparent hover:border-gray-200 dark:hover:border-gray-700"
      )}
      onClick={() => setCurrentNote(note.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex-1">
              {note.title}
            </h4>
            {note.isFavorited && (
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {note.content || "空白便笺"}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatDate(note.updatedAt)}
            </span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1">
            <div onClick={(e) => e.stopPropagation()}>
              <NoteToChat 
                content={note.content} 
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => handleToggleFavorite(note.id, e)}
            >
              {note.isFavorited ? (
                <Star className="h-3 w-3 text-yellow-500 fill-current" />
              ) : (
                <StarOff className="h-3 w-3" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => handleDeleteNote(note.id, e)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Search */}
      <div className="p-3 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder="搜索便笺..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="favorites">收藏</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="flex-1 overflow-y-auto mt-0">
          {filteredNotes.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              {searchQuery ? (
                <p>没有匹配的便笺</p>
              ) : notes.length === 0 ? (
                <>
                  <p>还没有便笺</p>
                  <p className="text-xs mt-1">创建你的第一条便笺开始使用吧</p>
                </>
              ) : (
                <p>暂无需要显示的便笺</p>
              )}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredNotes.map(renderNoteItem)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="favorites" className="flex-1 overflow-y-auto mt-0">
          {filteredNotes.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              {searchQuery ? (
                <p>没有匹配的收藏便笺</p>
              ) : (
                <>
                  <p>暂无收藏便笺</p>
                  <p className="text-xs mt-1">为便笺加星即可在此处看到</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredNotes.map(renderNoteItem)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
