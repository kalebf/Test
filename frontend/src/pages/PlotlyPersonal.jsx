import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist';

export default function PlotlyPersonal({ data = [], hoveredIndex = null }) {
  const chartRef = useRef(null);

  // Render chart
  useEffect(() => {
    if (!chartRef.current) return;

    // Clear chart if no data
    if (!data || data.length === 0) {
      Plotly.purge(chartRef.current);
      return;
    }

    const labels = data.map(cat => cat.name);
    const values = data.map(cat => cat.value);
    const colors = data.map(cat => cat.color || '#36A2EB');
    const pull = data.map(() => 0);

    const plotData = [{
      type: 'pie',
      labels,
      values,
      marker: { colors },
      textinfo: 'none',
      hovertemplate: '<b>%{label}</b><br>$%{value}<br>%{percent}<extra></extra>',
      hole: 0.3,
      pull
    }];

    const layout = {
      showlegend: false,
      margin: { t: 20, b: 20, l: 20, r: 20 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      autosize: true,
      transition: { duration: 200, easing: 'cubic-in-out' }
    };

    const config = { displayModeBar: false, responsive: true };

    Plotly.newPlot(chartRef.current, plotData, layout, config);

    const handleResize = () => {
      if (chartRef.current) Plotly.Plots.resize(chartRef.current);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) Plotly.purge(chartRef.current);
    };
  }, [data]);

  // Hover effect
  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    const pull = data.map((_, i) => i === hoveredIndex ? 0.1 : 0);
    Plotly.restyle(chartRef.current, { pull: [pull] });
  }, [hoveredIndex, data]);

  // Placeholder if no data
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No expense or income data available
      </div>
    );
  }

  return <div ref={chartRef} style={{ width: '100%', height: '100%' }} />;
}