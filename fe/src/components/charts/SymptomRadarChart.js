// src/components/charts/SymptomRadarChart.js
import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

const SymptomRadarChart = ({ symptoms, symptomValues }) => {
  // Transform data for radar chart
  const chartData = symptoms.map((symptom, index) => ({
    subject: symptom,
    value: symptomValues[index] || 0,
    fullMark: 1
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart outerRadius="80%" data={chartData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
        <PolarRadiusAxis domain={[0, 1]} tickCount={2} />
        <Radar
          name="Symptoms"
          dataKey="value"
          stroke="#1890ff"
          fill="#1890ff"
          fillOpacity={0.5}
        />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default SymptomRadarChart;