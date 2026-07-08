import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend
} from 'recharts';

interface ChartDataPoint { category: string; value: number; }

interface DashboardChartProps {
  data: {
    type?: string;
    datasets: Array<{ data: number[]; label: string }>;
    labels: string[];
  };
}

export default function DashboardChart({ data }: DashboardChartProps) {
  const { t } = useTranslation();
  const chartType = data.type || 'bar';

  const formattedData: ChartDataPoint[] = data.labels.map((label, index) => ({
    category: String(label),
    value: Number(data.datasets[0]?.data[index]) || 0,
  }));

  const colors = ['#eab308', '#ca8a04', '#a16207', '#854d0e', '#713f12', '#a1a1aa'];
  const tooltipStyle = { backgroundColor: '#030712', borderColor: '#374151', borderRadius: '0.75rem', color: '#fff' };

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="category" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}`, t('chart.tooltipTotal')]} />
            <Line type="monotone" dataKey="value" stroke="#eab308" strokeWidth={3}
              dot={{ r: 4, stroke: '#030712', strokeWidth: 2, fill: '#eab308' }} activeDot={{ r: 6 }} />
          </LineChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie data={formattedData} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={4}
              dataKey="value" nameKey="category"
              label={(props: any) => {
                const pct = props.percent ? `${(props.percent * 100).toFixed(0)}%` : '0%';
                return `${props.category} (${pct})`;
              }}
              labelLine={{ stroke: '#374151', strokeWidth: 1 }}>
              {formattedData.map((_, i) => <Cell key={`cell-${i}`} fill={colors[i % colors.length]} stroke="#111827" strokeWidth={2} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}`, t('chart.tooltipCount')]} />
            <Legend verticalAlign="bottom" height={36} iconType="circle"
              formatter={(value) => <span className="text-xs text-gray-400 font-medium">{value}</span>} />
          </PieChart>
        );
      case 'bar':
      default:
        return (
          <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="category" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={tooltipStyle}
              formatter={(v: any) => [`${v}`, t('chart.tooltipTotal')]} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
              {formattedData.map((_, i) => <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />)}
            </Bar>
          </BarChart>
        );
    }
  };

  return (
    <div className="w-full rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">
        {data.datasets[0]?.label || t('chart.defaultTitle')}
      </h3>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">{renderChart()}</ResponsiveContainer>
      </div>
    </div>
  );
}