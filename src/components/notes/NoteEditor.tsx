import { useState, useEffect } from "react";
import { useNoteStore } from "@/stores/NoteStore";
import { useThemeStore } from "@/stores/ThemeStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Edit3, Eye, Code } from "lucide-react";
import AceEditor from "react-ace";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypePrism from "rehype-prism-plus";
import { NoteToChat } from "./NoteToChat";

import "ace-builds/src-noconflict/mode-markdown";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";

export function NoteEditor() {
  const {
    getCurrentNote,
    updateNote,
  } = useNoteStore();
  
  const theme = useThemeStore((state) => state.theme);

  const currentNote = getCurrentNote();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');

  useEffect(() => {
    if (currentNote) {
      setTitle(currentNote.title);
      setContent(currentNote.content);
      setHasChanges(false);
    } else {
      setTitle("");
      setContent("");
      setHasChanges(false);
    }
    setIsEditing(false);
  }, [currentNote]);

  const handleSave = () => {
    if (currentNote && hasChanges) {
      updateNote(currentNote.id, { title, content });
      setHasChanges(false);
      setIsEditing(false);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setHasChanges(true);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasChanges(true);
  };

  if (!currentNote) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <Edit3 className="w-12 h-12 text-gray-400 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-800">
            未选择便笺
          </h2>
          <p className="text-gray-600">
            从列表中选择一个便笺，或创建新的便笺开始书写。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Note Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="font-medium"
              placeholder="便笺标题..."
              autoFocus
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditing(false);
                }
              }}
            />
          ) : (
            <h1 
              className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate cursor-text hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-1 rounded"
              onClick={() => setIsEditing(true)}
              title="点击以编辑标题"
            >
              {title || "未命名便笺"}
            </h1>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Add to Chat Button */}
          <NoteToChat content={content} />
          
          {/* View Mode Toggle */}
          <div className="flex rounded-md border dark:border-gray-600">
            <Button
              variant={viewMode === 'edit' ? 'default' : 'outline'}
              size="sm"
              className="h-8 rounded-r-none border-r-0"
              onClick={() => setViewMode('edit')}
            >
              <Code className="w-3 h-3 mr-1.5" />
              编辑
            </Button>
            <Button
              variant={viewMode === 'preview' ? 'default' : 'outline'}
              size="sm"
              className="h-8 rounded-none border-r-0"
              onClick={() => setViewMode('preview')}
            >
              <Eye className="w-3 h-3 mr-1.5" />
              预览
            </Button>
            <Button
              variant={viewMode === 'split' ? 'default' : 'outline'}
              size="sm"
              className="h-8 rounded-l-none"
              onClick={() => setViewMode('split')}
            >
              分屏
            </Button>
          </div>

          {hasChanges && (
            <Button
              onClick={handleSave}
              size="sm"
              className="h-8"
            >
              <Save className="w-3 h-3 mr-1.5" />
              保存
            </Button>
          )}
        </div>
      </div>

      {/* Note Content */}
      <div className="flex-1 min-h-0">
        {viewMode === 'edit' && (
          <div className="h-full p-0">
            <AceEditor
              mode="markdown"
              theme={theme === 'dark' ? 'monokai' : 'github'}
              value={content}
              onChange={handleContentChange}
              width="100%"
              height="100%"
              fontSize={14}
              showPrintMargin={false}
              showGutter={true}
              highlightActiveLine={true}
              setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,
                showLineNumbers: true,
                tabSize: 2,
                wrap: true
              }}
              placeholder="开始用 Markdown 记录你的便笺..."
            />
          </div>
        )}

        {viewMode === 'preview' && (
          <div className="h-full p-4 overflow-y-auto">
            <div className="max-w-none prose prose-sm">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypePrism]}
                components={{
                  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                  code: ({ inline, className, children, ...props }: any) => {
                    if (inline) {
                      return (
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-red-600" {...props}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="bg-gray-50 border rounded-lg p-4 overflow-x-auto my-4">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-300 pl-4 italic my-4 text-gray-700">
                      {children}
                    </blockquote>
                  ),
                  ul: ({ children }) => <ul className="list-disc pl-6 my-3 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-6 my-3 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 border-b pb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>,
                  h4: ({ children }) => <h4 className="text-base font-bold mb-2 mt-3">{children}</h4>,
                  h5: ({ children }) => <h5 className="text-sm font-bold mb-2 mt-2">{children}</h5>,
                  h6: ({ children }) => <h6 className="text-xs font-bold mb-2 mt-2">{children}</h6>,
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border-collapse border border-gray-300 bg-white">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold text-left">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-gray-300 px-3 py-2">{children}</td>
                  ),
                  hr: () => <hr className="my-6 border-gray-300" />,
                  img: ({ src, alt, ...props }) => (
                    <img src={src} alt={alt} className="max-w-full h-auto rounded-lg shadow-md my-4" {...props} />
                  ),
                  a: ({ href, children, ...props }) => (
                    <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" {...props}>
                      {children}
                    </a>
                  ),
                }}
              >
                {content || "*暂无内容可预览*"}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {viewMode === 'split' && (
          <div className="h-full flex">
            {/* Editor Panel */}
            <div className="flex-1 border-r">
              <AceEditor
                mode="markdown"
                theme={theme === 'dark' ? 'monokai' : 'github'}
                value={content}
                onChange={handleContentChange}
                width="100%"
                height="100%"
                fontSize={14}
                showPrintMargin={false}
                showGutter={true}
                highlightActiveLine={true}
                setOptions={{
                  enableBasicAutocompletion: true,
                  enableLiveAutocompletion: true,
                  enableSnippets: true,
                  showLineNumbers: true,
                  tabSize: 2,
                  wrap: true
                }}
                placeholder="开始用 Markdown 记录你的便笺..."
              />
            </div>
            
            {/* Preview Panel */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
              <div className="max-w-none prose prose-sm">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypePrism]}
                  components={{
                    p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                    code: ({ inline, className, children, ...props }: any) => {
                      if (inline) {
                        return (
                          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-red-600" {...props}>
                            {children}
                          </code>
                        );
                      }
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => (
                      <pre className="bg-white border rounded-lg p-4 overflow-x-auto my-4">
                        {children}
                      </pre>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-300 pl-4 italic my-4 text-gray-700">
                        {children}
                      </blockquote>
                    ),
                    ul: ({ children }) => <ul className="list-disc pl-6 my-3 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-6 my-3 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 border-b pb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-base font-bold mb-2 mt-3">{children}</h4>,
                    h5: ({ children }) => <h5 className="text-sm font-bold mb-2 mt-2">{children}</h5>,
                    h6: ({ children }) => <h6 className="text-xs font-bold mb-2 mt-2">{children}</h6>,
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full border-collapse border border-gray-300 bg-white">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold text-left">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-gray-300 px-3 py-2">{children}</td>
                    ),
                    hr: () => <hr className="my-6 border-gray-300" />,
                    img: ({ src, alt, ...props }) => (
                      <img src={src} alt={alt} className="max-w-full h-auto rounded-lg shadow-md my-4" {...props} />
                    ),
                    a: ({ href, children, ...props }) => (
                      <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" {...props}>
                        {children}
                      </a>
                    ),
                  }}
                >
                  {content || "*暂无内容可预览*"}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with metadata */}
      <div className="px-4 py-2 border-t bg-gray-50 dark:bg-gray-800 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
        <span>
          创建时间：{new Date(currentNote.createdAt).toLocaleDateString()}
        </span>
        <span>
          修改时间：{new Date(currentNote.updatedAt).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
