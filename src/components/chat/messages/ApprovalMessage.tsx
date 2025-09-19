import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { ApprovalRequest } from '@/types/codex';
import { DiffViewer } from '@/components/filetree/DiffViewer';
// Directly feed content or unified diff to DiffViewer; keep logic minimal

interface ApprovalMessageProps {
  approvalRequest: ApprovalRequest;
  onApproval: (approved: boolean) => void;
}

export const ApprovalMessage: React.FC<ApprovalMessageProps> = ({ 
  approvalRequest, 
  onApproval 
}) => {
  const [decision, setDecision] = useState<'approved' | 'denied' | null>(null);

  const handleApproval = (approved: boolean) => {
    setDecision(approved ? 'approved' : 'denied');
    onApproval(approved);
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800/50">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          {approvalRequest.type === 'exec' ? (
            <div>
              <code className="block bg-yellow-100 dark:bg-yellow-800/30 px-2 rounded text-sm">
                {approvalRequest.command}
              </code>
            </div>
          ) : approvalRequest.type === 'apply_patch' ? (
            <div>
              {approvalRequest.reason && (
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-1">原因：{approvalRequest.reason}</p>
              )}
              <p className="text-sm text-yellow-700 dark:text-yellow-300 px-1">编辑内容：</p>
              <div className="bg-yellow-100 dark:bg-yellow-800/30 p-2 rounded text-sm max-h-80 overflow-y-auto space-y-3">
                {approvalRequest.changes ? (
                  typeof approvalRequest.changes === 'string' ? (
                    <pre className="text-xs whitespace-pre-wrap">{approvalRequest.changes}</pre>
                  ) : (
                    Object.entries(approvalRequest.changes as Record<string, any>).map(([file, change], idx) => {
                      const rel = (p: string) => {
                        const root = approvalRequest.grant_root as string | undefined;
                        if (root && typeof p === 'string' && p.startsWith(root)) {
                          const trimmed = p.slice(root.length);
                          return trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
                        }
                        return p;
                      };
                      const header = rel(file);
                      const addContent = change?.add?.content as string | undefined;
                      const removeContent = change?.remove?.content as string | undefined;
                      const unified = (change?.update?.unified_diff || change?.update?.content || change?.modify?.unified_diff || change?.modify?.content || change?.add?.unified_diff || change?.remove?.unified_diff) as string | undefined;
                      return (
                        <div key={idx}>
                          <div className="font-mono text-xs font-medium text-yellow-700 dark:text-yellow-300 mb-1">{header}</div>
                          {addContent !== undefined || removeContent !== undefined ? (
                            <DiffViewer original={removeContent || ''} current={addContent || ''} fileName={header} />
                          ) : unified ? (
                            <DiffViewer unifiedDiff={unified} fileName={header} />
                          ) : (
                            <pre className="text-[11px] mt-1 whitespace-pre-wrap text-yellow-700 dark:text-yellow-300">{JSON.stringify(change, null, 2)}</pre>
                          )}
                        </div>
                      );
                    })
                  )
                ) : (
                  <span className="text-yellow-600 dark:text-yellow-400">暂无变更详情</span>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-1">将要修改的文件：</p>
              <ul className="list-disc list-inside text-sm text-yellow-600 dark:text-yellow-400">
                {approvalRequest.files?.map((file, idx) => (
                  <li key={idx}>{file}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex gap-2">
            {decision ? (
              <div className="flex items-center">
                {decision === 'approved' ? (
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                )}
              </div>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleApproval(false)}
                >
                  拒绝
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApproval(true)}
                >
                  允许
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
