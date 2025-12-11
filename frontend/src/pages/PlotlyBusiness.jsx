import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist';

export default function PlotlyBusiness({ data = [], color = '#36A2EB', type = 'income' }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // If no data, display a placeholder empty chart
    if (!data || data.length === 0) {
      const layout = {
        title: {
          text: 'No data available',
          font: { size: 14, color: '#555' },
          xref: 'paper',
          x: 0.5,
          y: 0.5,
          yanchor: 'middle',
          xanchor: 'center'
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: { visible: false },
        yaxis: { visible: false },
        height: 200 // slightly smaller than before
      };
      Plotly.newPlot(chartRef.current, [], layout, { displayModeBar: false, responsive: true });
      return;
    }

    const quarters = data.map(item => item.quarter);
    const amounts = data.map(item => item.amount);

    const plotData = [{
      type: 'bar',
      x: quarters,
      y: amounts,
      marker: {
        color: color,
        line: { width: 0 }
      },
      text: amounts.map(amt => `$${(amt / 1000).toFixed(0)}k`),
      textposition: 'outside',
      textfont: {
        size: 12,
        weight: 600,
        color: '#555'
      },
      hovertemplate: '<b>%{x}</b><br>$%{y:,.0f}<extra></extra>',
      cliponaxis: false
    }];

    const layout = {
      showlegend: false,
      margin: { t: 30, b: 40, l: 40, r: 20 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      height: 200, // reduced height
      xaxis: {
        tickfont: { size: 14, weight: 600, color: '#333' },
        showgrid: false,
        showline: false,
        zeroline: false
      },
      yaxis: {
        visible: false,
        showgrid: false,
        showline: false,
        zeroline: false,
        range: [0, Math.max(...amounts, 1) * 1.15] // safe range
      },
      bargap: 0.4
    };

    const config = { displayModeBar: false, responsive: true };

    Plotly.newPlot(chartRef.current, plotData, layout, config);

    return () => {
      if (chartRef.current) Plotly.purge(chartRef.current);
    };
  }, [data, color]);

  return <div ref={chartRef} style={{ width: '100%' }} />;
}