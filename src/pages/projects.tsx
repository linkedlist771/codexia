import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FolderOpen, Plus } from "lucide-react";
import { useFolderStore } from "@/stores/FolderStore";
import { Button } from "@/components/ui/button";
import { useLayoutStore } from "@/stores/layoutStore";
import { open } from "@tauri-apps/plugin-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Project {
  path: string;
  trust_level: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [trustDialogOpen, setTrustDialogOpen] = useState(false);
  const [pendingProjectPath, setPendingProjectPath] = useState<string | null>(null);
  const [isVersionControlled, setIsVersionControlled] = useState(false);
  const navigate = useNavigate();
  const { setCurrentFolder } = useFolderStore();
  const { setFileTree, setChatPane } = useLayoutStore();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const projectList = await invoke<Project[]>("read_codex_config");
      setProjects(projectList);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const openProject = (projectPath: string) => {
    setCurrentFolder(projectPath);
    // Enable both panels when opening a project
    setFileTree(true);
    setChatPane(true);
    // Navigate to chat page
    navigate("/chat");
  };

  const selectNewProject = async () => {
    try {
      const result = await open({
        directory: true,
        multiple: false,
      });
      if (result) {
        // Check if the selected folder is version controlled (Git)
        try {
          const vcs = await invoke<boolean>("is_version_controlled", { path: result });
          setPendingProjectPath(result);
          setIsVersionControlled(Boolean(vcs));
          if (vcs) {
            // Open trust dialog if version controlled
            setTrustDialogOpen(true);
          } else {
            // No VCS, proceed directly
            openProject(result);
          }
        } catch (e) {
          // If detection fails, fall back to opening the project
          console.error("Failed to detect VCS:", e);
          openProject(result);
        }
      }
    } catch (error) {
      console.error("Failed to select directory:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div>正在加载项目...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="w-full">
          <div className="flex items-center justify-between w-full">
            <h1 className="text-2xl font-bold">项目</h1>
            <Button onClick={selectNewProject}>
              <Plus className="w-3 h-3" />
              打开项目
            </Button>
          </div>
          <p className="text-muted-foreground">管理你的 Codex 项目</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">未找到项目</h3>
            <p className="text-muted-foreground">
              在项目目录运行 codex 后即可在此看到。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 grid grid-cols-1 md:grid-cols-2">
          {projects.map((project, index) => {
            const projectName =
              project.path.split(/[/\\]/).pop() || project.path;
            return (
              <Card
                key={index}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openProject(project.path)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-5 h-5" />
                      {projectName}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        project.trust_level === "trusted"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {project.trust_level === 'trusted' ? '已信任' : '未信任'}
                    </span>
                  </CardTitle>
                  <CardDescription>{project.path}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      {/* Trust dialog shown only when a VCS folder is selected */}
      <Dialog open={trustDialogOpen} onOpenChange={setTrustDialogOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>信任此项目？</DialogTitle>
            <DialogDescription>
              {`检测到该文件夹受版本控制。你可以允许 Codex 在此项目中工作时不再请求审批。`}
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {pendingProjectPath && isVersionControlled ? (
              <>
                {"\n  1. 是，允许 Codex 在此文件夹中工作且无需审批\n  2. 否，编辑和命令需要我审批"}
              </>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                const path = pendingProjectPath;
                setTrustDialogOpen(false);
                setPendingProjectPath(null);
                if (path) {
                  // Proceed without changing trust
                  openProject(path);
                }
              }}
            >
              否，需要审批
            </Button>
            <Button
              onClick={async () => {
                if (!pendingProjectPath) return;
                try {
                  await invoke("set_project_trust", {
                    path: pendingProjectPath,
                    trustLevel: "trusted",
                  });
                } catch (e) {
                  console.error("Failed to update project trust:", e);
                } finally {
                  const path = pendingProjectPath;
                  setTrustDialogOpen(false);
                  setPendingProjectPath(null);
                  if (path) {
                    openProject(path);
                  }
                }
              }}
            >
              是，允许且无需审批
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
