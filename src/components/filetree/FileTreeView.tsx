import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { useSettingsStore } from "@/stores/SettingsStore";
import { useFolderStore } from "@/stores/FolderStore";
import { useContextFilesStore } from "@/stores/ContextFilesStore";
import { useFileTokens } from "@/hooks/useFileTokens";
import { FileTreeHeader } from "./FileTreeHeader";
import { FileTreeItem } from "./FileTreeItem";

interface FileEntry {
  name: string;
  path: string;
  is_directory: boolean;
  size?: number;
  extension?: string;
}

interface FileTreeProps {
  currentFolder?: string;
  onAddToChat?: (path: string) => void;
  onFileClick?: (path: string) => void;
}

export function FileTree({
  currentFolder,
  onAddToChat,
  onFileClick,
}: FileTreeProps) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [searchResults, setSearchResults] = useState<FileEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { excludeFolders } = useSettingsStore();
  const { setCurrentFolder } = useFolderStore();
  const { addFile, clearFiles } = useContextFilesStore();
  const { calculateTokens } = useFileTokens();
  const [refreshMap, setRefreshMap] = useState<Record<string, number>>({});
  const watchedFoldersRef = useRef<Set<string>>(new Set());
  const [canonicalCurrent, setCanonicalCurrent] = useState<string | null>(null);
  const canonicalMapRef = useRef<Map<string, string>>(new Map()); // original -> canonical
  const canonicalToOriginalRef = useRef<Map<string, string>>(new Map()); // canonical -> original

  const loadDirectory = async (path?: string) => {
    setLoading(true);
    setError(null);

    try {
      let targetPath = path || currentFolder;
      if (!targetPath) {
        const defaultDirs = await invoke<string[]>("get_default_directories");
        targetPath = defaultDirs[0];
        setCurrentFolder(targetPath);
      }

      const result = await invoke<FileEntry[]>("read_directory", {
        path: targetPath,
      });
      setEntries(result);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };


  const toggleFolder = async (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (expandedFolders.has(folderPath)) {
      newExpanded.delete(folderPath);
      // Stop watching when collapsing
      try { await invoke("stop_watch_directory", { folderPath }); } catch {}
      watchedFoldersRef.current.delete(folderPath);
      // Drop canonical mapping for this folder
      const canonical = canonicalMapRef.current.get(folderPath);
      if (canonical) {
        canonicalMapRef.current.delete(folderPath);
        canonicalToOriginalRef.current.delete(canonical);
      }
    } else {
      newExpanded.add(folderPath);
      // Start watching newly expanded folder
      if (!watchedFoldersRef.current.has(folderPath)) {
        try { await invoke("start_watch_directory", { folderPath }); } catch {}
        watchedFoldersRef.current.add(folderPath);
      }
      // Cache canonical path for reliable event matching
      try {
        const canonical = await invoke<string>("canonicalize_path", { path: folderPath });
        canonicalMapRef.current.set(folderPath, canonical);
        canonicalToOriginalRef.current.set(canonical, folderPath);
      } catch {}
    }
    setExpandedFolders(newExpanded);
  };

  const handleAddToChat = (path: string) => {
    addFile(path);
    if (onAddToChat) {
      onAddToChat(path);
    }
  };

  const handleFileClick = (path: string, isDirectory: boolean) => {
    if (!isDirectory) {
      clearFiles();
      addFile(path);
      if (onFileClick) {
        onFileClick(path);
      }
    }
  };

  const handleSetWorkingFolder = (folderPath: string) => {
    setCurrentFolder(folderPath);
    setFilterText("");
    loadDirectory(folderPath);
  };

  const isFiltered = (entry: FileEntry): boolean => {
    // Always hide excluded folders in tree rendering
    if (entry.is_directory && excludeFolders.includes(entry.name)) return true;
    return false;
  };

  useEffect(() => {
    loadDirectory();
  }, [currentFolder]);

  // Reset watchers and expansion when changing root folder
  useEffect(() => {
    const reset = async () => {
      for (const p of Array.from(watchedFoldersRef.current)) {
        try { await invoke("stop_watch_directory", { folderPath: p }); } catch {}
      }
      watchedFoldersRef.current.clear();
      setExpandedFolders(new Set());
      setRefreshMap({});
    };
    reset();
  }, [currentFolder]);

  // Always watch the current root folder for top-level changes
  useEffect(() => {
    const run = async () => {
      if (!currentFolder) return;
      try { await invoke("start_watch_directory", { folderPath: currentFolder }); } catch {}
      watchedFoldersRef.current.add(currentFolder);
      try {
        const canonical = await invoke<string>("canonicalize_path", { path: currentFolder });
        setCanonicalCurrent(canonical);
      } catch {
        setCanonicalCurrent(currentFolder);
      }
    };
    run();
    return () => {
      const stop = async () => {
        if (!currentFolder) return;
        try { await invoke("stop_watch_directory", { folderPath: currentFolder }); } catch {}
        watchedFoldersRef.current.delete(currentFolder);
      };
      stop();
    };
  }, [currentFolder]);

  // Listen for file system change events from backend and refresh affected folders
  useEffect(() => {
    let unlisten: UnlistenFn | null = null;
    const setup = async () => {
      unlisten = await listen<{ path: string; kind: string }>("fs_change", async (event) => {
        const changedPath = event.payload.path;
        // Compare against canonical root
        if (canonicalCurrent && changedPath.startsWith(canonicalCurrent)) {
          if (currentFolder) loadDirectory(currentFolder);
        }

        // Bump refresh keys based on canonical mapping where available
        setRefreshMap((prev) => {
          const next: Record<string, number> = { ...prev };
          expandedFolders.forEach((folder) => {
            const canonical = canonicalMapRef.current.get(folder) || folder;
            if (changedPath.startsWith(canonical)) {
              next[folder] = (next[folder] || 0) + 1;
            }
          });
          return next;
        });
      });
    };
    setup();
    return () => { if (unlisten) unlisten(); };
  }, [currentFolder, expandedFolders, canonicalCurrent]);

  // On unmount, stop all active watchers
  useEffect(() => {
    return () => {
      (async () => {
        for (const p of Array.from(watchedFoldersRef.current)) {
          try { await invoke("stop_watch_directory", { folderPath: p }); } catch {}
        }
        watchedFoldersRef.current.clear();
      })();
    };
  }, []);

  // Global search across the entire file tree starting at currentFolder
  useEffect(() => {
    let cancelled = false;

    const runSearch = async () => {
      const query = filterText.trim();
      if (!query) {
        setIsSearching(false);
        setSearchResults([]);
        return;
      }

      try {
        setIsSearching(true);

        let targetPath = currentFolder;
        if (!targetPath) {
          const defaultDirs = await invoke<string[]>("get_default_directories");
          targetPath = defaultDirs[0];
          setCurrentFolder(targetPath);
        }

        const results = await invoke<FileEntry[]>("search_files", {
          root: targetPath,
          query,
          excludeFolders: excludeFolders,
          // keep defaults on backend if not provided
        });

        if (!cancelled) {
          setSearchResults(results);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Global search failed:", err);
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    };

    // Debounce a bit to avoid spamming the backend while typing
    const timer = setTimeout(runSearch, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filterText, currentFolder, excludeFolders]);

  if (loading && entries.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">正在加载文件...</div>
    );
  }

  if (error) {
    return <div className="p-4 text-center text-destructive">错误：{error}</div>;
  }

  return (
    <div className="w-full h-full flex flex-col">
      <FileTreeHeader
        currentFolder={currentFolder}
        filterText={filterText}
        onFilterTextChange={setFilterText}
        showFilter={showFilter}
        onToggleFilter={() => setShowFilter(!showFilter)}
        onRefresh={() => loadDirectory()}
        excludeFolders={excludeFolders}
      />

      <div className="flex-1 overflow-y-auto">
        {filterText.trim() ? (
          <>
            {isSearching && entries.length === 0 && searchResults.length === 0 && (
              <div className="p-2 text-xs text-muted-foreground">搜索中...</div>
            )}
            {searchResults.map((entry) => (
              <FileTreeItem
                key={entry.path}
                entry={entry}
                expandedFolders={expandedFolders}
                onToggleFolder={toggleFolder}
                onAddToChat={handleAddToChat}
                onFileClick={handleFileClick}
                onSetWorkingFolder={handleSetWorkingFolder}
                onCalculateTokens={calculateTokens}
                isFiltered={isFiltered}
                refreshKeyMap={refreshMap}
              />
            ))}
            {!isSearching && searchResults.length === 0 && (
              <div className="p-2 text-xs text-muted-foreground">未找到匹配项</div>
            )}
          </>
        ) : (
          entries.map((entry) => (
            <FileTreeItem
              key={entry.path}
              entry={entry}
              expandedFolders={expandedFolders}
              onToggleFolder={toggleFolder}
              onAddToChat={handleAddToChat}
              onFileClick={handleFileClick}
              onSetWorkingFolder={handleSetWorkingFolder}
              onCalculateTokens={calculateTokens}
              isFiltered={isFiltered}
              refreshKeyMap={refreshMap}
              // Pass per-folder refresh signal down to subfolder loaders
              // via SubFolderContent
            />
          ))
        )}
      </div>
    </div>
  );
}
