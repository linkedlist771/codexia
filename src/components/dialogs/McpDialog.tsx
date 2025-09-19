import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Trash2, Plus, Edit, Save, X } from 'lucide-react';
import { McpServerConfig } from '@/types/codex';
import { toast } from 'sonner';

interface McpDialogProps {
  children: React.ReactNode;
}

export function McpDialog({ children }: McpDialogProps) {
  const [open, setOpen] = useState(false);
  const [servers, setServers] = useState<Record<string, McpServerConfig>>({});
  const [newServerName, setNewServerName] = useState('');
  const [newServerProtocol, setNewServerProtocol] = useState<'stdio' | 'http'>('stdio');
  const [commandConfig, setCommandConfig] = useState({
    command: '',
    args: '',
    env: '',
  });
  const [httpConfig, setHttpConfig] = useState({
    url: '',
  });
  const [editingServer, setEditingServer] = useState<string | null>(null);
  const [editConfig, setEditConfig] = useState<{
    name: string;
    protocol: 'stdio' | 'http';
    command: { command: string; args: string; env: string };
    http: { url: string };
  } | null>(null);

  const loadServers = async () => {
    try {
      const mcpServers = await invoke<Record<string, McpServerConfig>>('read_mcp_servers');
      setServers(mcpServers);
    } catch (error) {
      console.error('Failed to load MCP servers:', error);
    }
  };

  useEffect(() => {
    if (open) {
      loadServers();
    }
  }, [open]);

  const handleAddServer = async () => {
    if (!newServerName) return;

    try {
      let config: McpServerConfig;
      
      if (newServerProtocol === 'stdio') {
        config = {
          type: 'stdio',
          command: commandConfig.command,
          args: commandConfig.args.split(' ').filter(arg => arg.trim()),
        };
        
        if (commandConfig.env && commandConfig.env.trim()) {
          try {
            config.env = JSON.parse(commandConfig.env);
          } catch (e) {
            toast.error('Invalid JSON format for environment variables');
            return;
          }
        }
      } else {
        config = {
          type: 'http',
          url: httpConfig.url,
        };
      }

      await invoke('add_mcp_server', { name: newServerName, config });
      
      setNewServerName('');
      setCommandConfig({ command: '', args: '', env: '' });
      setHttpConfig({ url: '' });
      loadServers();
    } catch (error) {
      console.error('Failed to add MCP server:', error);
      toast.error('Failed to add MCP server: ' + error);
    }
  };

  const handleDeleteServer = async (name: string) => {
    try {
      await invoke('delete_mcp_server', { name });
      loadServers();
    } catch (error) {
      console.error('Failed to delete MCP server:', error);
      toast.error('Failed to delete MCP server: ' + error);
    }
  };

  const handleEditServer = (name: string, config: McpServerConfig) => {
    setEditingServer(name);
    setEditConfig({
      name,
      protocol: config.type === 'stdio' ? 'stdio' : 'http',
      command: {
        command: config.type === 'stdio' ? ('command' in config ? config.command : '') : '',
        args: config.type === 'stdio' ? ('args' in config ? config.args.join(' ') : '') : '',
        env: config.type === 'stdio' && 'env' in config && config.env ? JSON.stringify(config.env, null, 2) : '',
      },
      http: {
        url: config.type === 'http' ? ('url' in config ? config.url : '') : '',
      },
    });
  };

  const handleSaveEdit = async () => {
    if (!editConfig || !editingServer) return;

    try {
      let config: McpServerConfig;
      
      if (editConfig.protocol === 'stdio') {
        config = {
          type: 'stdio',
          command: editConfig.command.command,
          args: editConfig.command.args.split(' ').filter(arg => arg.trim()),
        };
        
        if (editConfig.command.env && editConfig.command.env.trim()) {
          try {
            config.env = JSON.parse(editConfig.command.env);
          } catch (e) {
            toast.error('Invalid JSON format for environment variables');
            return;
          }
        }
      } else {
        config = {
          type: 'http',
          url: editConfig.http.url,
        };
      }

      await invoke('delete_mcp_server', { name: editingServer });
      await invoke('add_mcp_server', { name: editConfig.name, config });
      
      setEditingServer(null);
      setEditConfig(null);
      loadServers();
    } catch (error) {
      console.error('Failed to update MCP server:', error);
      toast.error('Failed to update MCP server: ' + error);
    }
  };

  const handleCancelEdit = () => {
    setEditingServer(null);
    setEditConfig(null);
  };

  const defaultServers = [
    {
      name: 'fetch',
      description: 'Web scraping and fetching',
      config: {
        type: 'stdio' as const,
        command: 'uvx',
        args: ['-y', 'mcp-server-fetch'],
      }
    },
    {
      name: 'deepwiki',
      description: 'DeepWiki automatically generates architecture diagrams, documentation, and links to source code to help you understand unfamiliar codebases quickly.',
      config: {
        type: 'http' as const,
        url: 'https://mcp.deepwiki.com/mcp'
      }
    }
  ];

  const handleAddDefaultServer = async (defaultServer: typeof defaultServers[0]) => {
    try {
      await invoke('add_mcp_server', { name: defaultServer.name, config: defaultServer.config });
      loadServers();
    } catch (error) {
      console.error('Failed to add default MCP server:', error);
      toast.error('Failed to add MCP server: ' + error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto sm:!max-w-4xl">
        <DialogHeader>
          <DialogTitle>MCP 服务器管理</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Default Servers Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">快速添加服务器</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {defaultServers.map((defaultServer) => {
                const isAlreadyAdded = Object.hasOwnProperty.call(servers, defaultServer.name);
                return (
                  <Card key={defaultServer.name} className={isAlreadyAdded ? 'opacity-50' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{defaultServer.name}</div>
                          <div className="text-xs text-gray-500">{defaultServer.description}</div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleAddDefaultServer(defaultServer)}
                          disabled={isAlreadyAdded}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          {isAlreadyAdded ? '已添加' : '添加'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">已配置的服务器</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.entries(servers).map(([name, config]) => (
                  <Card key={name}>
                    {editingServer === name ? (
                      <div className="p-4">
                        <div className="space-y-4">
                          <div>
                            <div className="text-sm font-medium mb-1">服务器名称</div>
                            <Input
                              value={editConfig?.name ?? ''}
                              onChange={(e) => setEditConfig(prev => prev ? { ...prev, name: e.target.value } : null)}
                            />
                          </div>

                          <Tabs value={editConfig?.protocol} onValueChange={(value) => setEditConfig(prev => prev ? { ...prev, protocol: value as 'stdio' | 'http' } : null)}>
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="stdio">Stdio</TabsTrigger>
                              <TabsTrigger value="http">HTTP</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="stdio" className="space-y-4">
                              <div>
                                <div className="text-sm font-medium mb-1">命令</div>
                                <Input
                                  value={editConfig?.command.command || ''}
                                  onChange={(e) => setEditConfig(prev => prev ? { ...prev, command: { ...prev.command, command: e.target.value } } : null)}
                                />
                              </div>
                              <div>
                                <div className="text-sm font-medium mb-1">参数</div>
                                <Input
                                  value={editConfig?.command.args || ''}
                                  onChange={(e) => setEditConfig(prev => prev ? { ...prev, command: { ...prev.command, args: e.target.value } } : null)}
                                />
                              </div>
                              <div>
                                <div className="text-sm font-medium mb-1">环境变量（JSON）</div>
                                <Textarea
                                  value={editConfig?.command.env || ''}
                                  onChange={(e) => setEditConfig(prev => prev ? { ...prev, command: { ...prev.command, env: e.target.value } } : null)}
                                  rows={3}
                                />
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="http" className="space-y-4">
                              <div>
                                <div className="text-sm font-medium mb-1">URL</div>
                                <Input
                                  value={editConfig?.http.url || ''}
                                  onChange={(e) => setEditConfig(prev => prev ? { ...prev, http: { ...prev.http, url: e.target.value } } : null)}
                                  placeholder="https://mcp.example.com/mcp"
                                />
                              </div>
                            </TabsContent>
                          </Tabs>

                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveEdit}>
                              <Save className="h-4 w-4 mr-1" />
                              保存
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                              <X className="h-4 w-4 mr-1" />
                              取消
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center justify-between">
                            {name}
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditServer(name, config)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteServer(name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="text-xs text-gray-600">
                            {config.type === 'stdio' && (
                              <div>
                                <strong>Command:</strong> {'command' in config ? config.command : ''}
                                {'args' in config && config.args && config.args.length > 0 && (
                                  <div><strong>Args:</strong> {config.args.join(' ')}</div>
                                )}
                                {'env' in config && config.env && (
                                  <div><strong>Env:</strong> {Object.keys(config.env).join(', ')}</div>
                                )}
                              </div>
                            )}
                            {config.type === 'http' && (
                              <div>
                                <strong>HTTP:</strong> {'url' in config ? config.url : ''}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </>
                    )}
                  </Card>
                ))}
                {Object.keys(servers).length === 0 && (
                  <div className="text-gray-500 text-center py-8">
                    暂未配置 MCP 服务器
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">添加新服务器</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-1">服务器名称</div>
                  <Input
                    value={newServerName}
                    onChange={(e) => setNewServerName(e.target.value)}
                    placeholder="例如：fetch、deepwiki"
                  />
                </div>

                <Tabs value={newServerProtocol} onValueChange={(value) => setNewServerProtocol(value as 'stdio' | 'http')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="stdio">Stdio</TabsTrigger>
                    <TabsTrigger value="http">HTTP</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="stdio" className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-1">Stdio</div>
                      <Input
                        value={commandConfig.command}
                        onChange={(e) => setCommandConfig(prev => ({ ...prev, command: e.target.value }))}
                        placeholder="例如：uvx、npx"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">参数</div>
                      <Input
                        value={commandConfig.args}
                        onChange={(e) => setCommandConfig(prev => ({ ...prev, args: e.target.value }))}
                        placeholder="例如：-y mcp-server-fetch"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">环境变量（JSON，可选）</div>
                      <Textarea
                        value={commandConfig.env}
                        onChange={(e) => setCommandConfig(prev => ({ ...prev, env: e.target.value }))}
                        placeholder='{"API_KEY": "value"} - 若不需要可留空'
                        rows={3}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="http" className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-1">URL</div>
                      <Input
                        value={httpConfig.url}
                        onChange={(e) => setHttpConfig(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="https://mcp.deepwiki.com/mcp"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <Button onClick={handleAddServer} disabled={!newServerName} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  添加服务器
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
