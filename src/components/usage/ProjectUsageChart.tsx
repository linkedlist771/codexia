import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { UsageSummary } from "@/utils/usageAnalysis";

interface ProjectUsageChartProps {
  usageData: UsageSummary;
  formatCurrency: (amount: number) => string;
  formatTokens: (tokens: number) => string;
}

export function ProjectUsageChart({ usageData, formatCurrency, formatTokens }: ProjectUsageChartProps) {
  const projectChartData = Object.entries(usageData.projectBreakdown)
    .sort((a, b) => b[1].cost - a[1].cost)
    .slice(0, 10)
    .map(([project, data]) => ({
      name: project.length > 20 ? project.substring(0, 20) + '...' : project,
      sessions: data.sessions,
      cost: data.cost,
      tokens: data.tokens,
    }));

  return (
    <Card className="bg-slate-950/50 border-slate-800/50">
      <CardHeader>
        <CardTitle className="text-slate-100">按项目统计</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={projectChartData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip 
              formatter={(value, name) => [
                name === 'cost' ? formatCurrency(value as number) : 
                name === 'tokens' ? formatTokens(value as number) : value,
                name
              ]}
            />
            <Bar dataKey="cost" fill="#8884d8" name="费用" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
