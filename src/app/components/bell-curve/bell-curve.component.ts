import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
// import { Chart, ChartData, ChartConfiguration, LinearScale, Title, LineController, LineElement, PointElement, CategoryScale } from 'chart.js';
import * as chartJS from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

@Component({
  selector: 'app-bell-curve',
  standalone: false,
  templateUrl: './bell-curve.component.html',
  styleUrl: './bell-curve.component.css'
})
export class BellCurveComponent {
  bellCurveLabels: number[] = Array.from({ length: 101 }, (_, i) => i);

  avgScore = 75;
  minScore = 40;
  maxScore = 100;
  stdDev = 7.5;
  studentCount = 40;

  doughnutChartLabels = ['0-39', '40-49', '50-59', '60-69', '70-79', '80+'];
  // doughnutChartValues = [12, 19, 3, 5, 2, 8, 12, 10, 2];
  
  
  doughnutChartData = {
    labels: this.doughnutChartLabels,
    datasets: [
      {
        data: [12, 19, 3, 5, 2, 8],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#AA65D8', '#FFA600', '#80ff80']
      }
    ]
  };

  doughnutChartValues = this.doughnutChartData.datasets[0].data;

  doughnutChartOptions: chartJS.ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        formatter: (value, context) => {
          const total = this.doughnutChartValues.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${value} (${percentage}%)`;
        },
        color: '#fff',
        font: {
          weight: 'bold'
        }
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (tooltipItem) => {
            const value = tooltipItem.raw as number;
            const total = this.doughnutChartValues.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${tooltipItem.label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      duration: 1000, 
      easing: 'easeOutQuad'
    } as Partial<chartJS.AnimationSpec<'doughnut'>>
  };
  

  doughnutChartPlugins = [ChartDataLabels];

  bellCurveData = {
    labels: this.bellCurveLabels,
    datasets: [
      {
        label: 'Term 1 (2025)',
        data: this.generateBellCurveData(),
        borderColor: '#0000FF',
        backgroundColor: 'rgba(0,0,255,0.2)', // ระบายพื้นที่ใต้โค้ง
        fill: true, // ให้เติมพื้นที่ใต้เส้นโค้ง
        pointRadius: 0, // ซ่อนจุดข้อมูล
        tension: 0.4, // ให้เส้นโค้งขึ้น
      }
    ]
  };

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'คะแนน',
        }
      },
      y: {
        title: {
          display: true,
          text: 'ความน่าจะเป็น',
        }
      }
    }
  };

  generateBellCurveData(): number[] {
    const mean = 75; // ค่าเฉลี่ย
    const stdDev = 7.5; // ค่าเบี่ยงเบนมาตรฐาน
    const factor = 1 / (stdDev * Math.sqrt(2 * Math.PI));

    return this.bellCurveLabels.map(x => {
      const exponent = -0.5 * Math.pow((x - mean) / stdDev, 2);
      return factor * Math.exp(exponent) * 100; // ปรับสเกลให้เห็นชัด
    });
  }
}