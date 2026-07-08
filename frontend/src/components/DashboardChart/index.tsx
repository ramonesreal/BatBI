import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend
} from 'recharts';

interface ChartData {
  categoria: string;
  valor: number;
}

interface DashboardChartProps {
  data: {
    type?: string; // 🚀 Captura se é 'bar', 'line' ou 'pie'
    datasets: Array<{ data: number[]; label: string }>;
    labels: string[];
  };
}

export default function DashboardChart({ data }: DashboardChartProps) {
  const chartType = data.type || 'bar';

  // Converte a estrutura matricial do Pandas no formato plano de objetos do Recharts
  const formattedData: ChartData[] = data.labels.map((label, index) => ({
    categoria: label,
    valor: data.datasets[0]?.data[index] || 0,
  }));

  // Paleta de cores escalável no estilo Gotham (Amarelo/Dourado/Zinco)
  const colors = ['#eab308', '#ca8a04', '#a16207', '#854d0e', '#713f12', '#a1a1aa'];

  // 🛠️ Renderizador condicional do motor visual
  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="categoria" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#030712', borderColor: '#374151', borderRadius: '0.75rem', color: '#fff' }}
              formatter={(value: any) => [`${value}`, 'Valor Total']}
            />
            <Line
              type="monotone"
              dataKey="valor"
              stroke="#eab308"
              strokeWidth={3}
              dot={{ r: 4, stroke: '#030712', strokeWidth: 2, fill: '#eab308' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={formattedData}
              cx="50%"
              cy="45%"
              innerRadius={60} // Estilo Rosca/Donut elegante
              outerRadius={90}
              paddingAngle={4}
              dataKey="valor"
              nameKey="categoria"
              label={(props: any) => {
                const { categoria, percent } = props;
                const porcentagem = percent ? `${(percent * 100).toFixed(0)}%` : '0%';
                return `${categoria} (${porcentagem})`;
              }}
              labelLine={{ stroke: '#374151', strokeWidth: 1 }}
            >
              {formattedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="#111827" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#030712', borderColor: '#374151', borderRadius: '0.75rem', color: '#fff' }}
              formatter={(value: any) => [`${value}`, 'Quantidade']}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => <span className="text-xs text-gray-400 font-medium">{value}</span>}
            />
          </PieChart>
        );

      case 'bar':
      default:
        return (
          <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="categoria" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
              contentStyle={{ backgroundColor: '#030712', borderColor: '#374151', borderRadius: '0.75rem', color: '#fff' }}
              formatter={(value: any) => [`${value}`, 'Valor Total']}
            />
            <Bar dataKey="valor" radius={[6, 6, 0, 0]} barSize={40}>
              {formattedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        );
    }
  };

  return (
    <div className="w-full rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">
        {data.datasets[0]?.label || 'Visualização Analítica'}
      </h3>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}