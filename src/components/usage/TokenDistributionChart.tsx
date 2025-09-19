import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PieChart,
  Pie,
  Cell,
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { UsageSummary } from "@/utils/usageAnalysis";

const COLORS = ['#00D9FF', '#00FF88', '#FF6B35', '#A855F7', '#F97316', '#10B981'];

interface TokenDistributionChartProps {
  usageData: UsageSummary;
  formatTokens: (tokens: number) => string;
}

export function TokenDistributionChart({ usageData, formatTokens }: TokenDistributionChartProps) {
  const tokenBreakdownData = [
    { name: '输入', value: usageData.inputTokens, color: '#0088FE' },
    { name: '输出', value: usageData.outputTokens, color: '#00C49F' },
    { name: '缓存写入', value: usageData.cacheWriteTokens, color: '#FFBB28' },
    { name: '缓存读取', value: usageData.cacheReadTokens, color: '#FF8042' },
  ].filter(item => item.value > 0);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-slate-100">Token 分布</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tokenBreakdownData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {tokenBreakdownData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatTokens(value as number)} />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="space-y-4">
            {tokenBreakdownData.map((item, index) => (
              <div key={item.name} className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="text-sm font-medium text-slate-200">{item.name}</span>
                <span className="text-sm text-slate-400 ml-auto">
                  {formatTokens(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
