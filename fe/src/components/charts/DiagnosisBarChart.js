// src/components/charts/DiagnosisBarChart.js
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ErrorBar
} from 'recharts';

const DiagnosisBarChart = ({ data }) => {
  // Transform data if needed
  const chartData = Object.entries(data.probabilities || {}).map(([disease, probability]) => ({
    name: disease,
    probability: parseFloat((probability * 100).toFixed(1)),
    uncertainty: parseFloat((data.uncertainties[disease] * 100).toFixed(1))
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          height={80}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft' }}
          domain={[0, 100]}
        />
        <Tooltip
          formatter={(value) => [`${value}%`, 'Probability']}
          labelStyle={{ fontWeight: 'bold' }}
        />
        <Legend verticalAlign="top" height={36} />
        <Bar
          dataKey="probability"
          name="Probability (%)"
          fill="#1890ff"
          isAnimationActive={true}
          animationDuration={1000}
        >
          <ErrorBar dataKey="uncertainty" width={4} strokeWidth={2} stroke="#ff7875" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DiagnosisBarChart;