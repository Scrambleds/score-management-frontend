import {
  Component,
  OnInit,
  OnChanges,
  AfterViewInit,
  SimpleChanges,
  Input,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  EventEmitter,
} from '@angular/core';
import * as chartJS from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { DashboardService } from '../../services/dashboard/dashboard.service';

@Component({
  selector: 'app-bell-curve',
  standalone: false,
  templateUrl: './bell-curve.component.html',
  styleUrls: ['./bell-curve.component.css'],
})
export class BellCurveComponent implements OnChanges, OnInit, AfterViewInit {
  chart: any;
  @ViewChild('dChart', { static: false }) dChart!: ElementRef;
  @ViewChild('bChart', { static: false }) bChart!: ElementRef;
  jsonArray: any = [25, 15, 20, 15, 20, 10];
  chartLabels: any = ['0-39', '40-49', '50-59', '60-69', '70-79', '80+'];

  chartLabels_ScoreType: any = ['0-39', '40+'];

  cutOut: number = 75;
  backgroundColors: any = [
    '#E15D44',
    '#55B4B0',
    '#DFCFBE',
    '#9B2335',
    '#5B5EA6',
    '#d6a7f5',
  ];
  constructor(
    private DashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {}
  @Input() dashboardData: any;
  @Input() scoreType: string = '';
  @Input() dashboardDataUpdated: EventEmitter<any> = new EventEmitter();
  bellCurveChart: chartJS.Chart | undefined;

  bellCurveLabels: number[] = Array.from({ length: 101 }, (_, i) => i);

  avgScore!: any;
  minScore!: any;
  maxScore!: any;
  stdDev!: any;
  studentCount!: any;

  doughnutChartLabels = ['0-39', '40-49', '50-59', '60-69', '70-79', '80+'];
  doughnutChartData = {
    labels: this.doughnutChartLabels,
    datasets: [
      {
        data: [0, 0, 0, 0, 0, 0],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#AA65D8',
          '#FFA600',
          '#80ff80',
        ],
      },
    ],
  };

  doughnutChartOptions: chartJS.ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        formatter: (value, context) => {
          const total = this.doughnutChartData.datasets[0].data.reduce(
            (a, b) => a + b,
            0
          );
          const percentage = ((value / total) * 100).toFixed(1);
          return `${value} (${percentage}%)`;
        },
        color: '#fff',
        font: {
          weight: 'bold',
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuad',
    },
  };

  doughnutChartPlugins = [ChartDataLabels];

  bellCurveData = {
    labels: this.bellCurveLabels,
    datasets: [
      {
        label: 'Term 1 (2025)',
        // animations: {
        //   y: {
        //     duration: 2000,
        //     delay: 500
        //   }
        // },
        data: this.generateBellCurveData(),
        borderColor: '#0000FF',
        backgroundColor: 'rgba(0,0,255,0.2)',
        fill: true,
        pointRadius: 0,
        tension: 0.4,
      },
    ],
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['dashboardData'] && changes['dashboardData'].currentValue) {
      this.updateChartData();
      this.setData(this.chart, this.jsonArray);
    }
  }

  // ngOnInit(): void {
  //   this.loadDashboardStats();
  //   const ref = this.loadDashboardStats();
  //   console.log("MY LOAD DATA!!", ref);
  // }

  ngOnInit(): void {
    this.dashboardDataUpdated.subscribe((data) => {
      this.dashboardData = data;
      this.updateChartData();
    });

    // this.resetDashboard();
  }

  resetDashboard() {
    this.jsonArray = [0, 0, 0, 0, 0, 0];
    this.doughnutChartData.datasets[0].data = [0, 0, 0, 0, 0, 0];
    this.avgScore = 0;
    this.minScore = 0;
    this.maxScore = 0;
    this.stdDev = 0;
    this.studentCount = 0;

    if (this.bellCurveChart) {
      this.bellCurveChart.data.datasets[0].data = Array(
        this.bellCurveLabels.length
      ).fill(0);
      this.bellCurveChart.update();
    }

    this.refreshDashboard();
  }

  ngAfterViewInit() {
    let cvs: any = this.dChart?.nativeElement;
    if (cvs) {
      this.chart = new chartJS.Chart(cvs, {
        type: 'doughnut',
        data: {
          labels: this.chartLabels,
          datasets: [
            {
              // label: '# number',
              data: [0, 0, 0, 0, 0, 0],
              backgroundColor: this.backgroundColors,
              borderWidth: 5,
            },
          ],
        },
        options: {
          responsive: false,
          layout: {
            padding: {
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function (tooltipItem) {
                  const dataset = tooltipItem.dataset;
                  const total = dataset.data.reduce(
                    (acc, value) => acc + value,
                    0
                  );
                  const currentValue = dataset.data[tooltipItem.dataIndex];
                  const percentage = ((currentValue / total) * 100).toFixed(2);
                  return `${tooltipItem.label}: ${percentage}%`;
                },
              },
            },
          },
        },
      });
    }

    let bvs: any = this.bChart?.nativeElement;
    if (bvs) {
      this.bellCurveChart = new chartJS.Chart(bvs, {
        type: 'line',
        data: {
          labels: this.bellCurveLabels,
          datasets: [
            {
              data: Array(this.bellCurveLabels.length).fill(0),
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgb(54, 162, 235)',
              pointBackgroundColor: 'rgb(54, 162, 235)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgb(54, 162, 235)',
              fill: true,
              pointRadius: 0,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              title: {
                display: true,
                text: 'คะแนน',
              },
            },
            y: {
              title: {
                display: true,
                text: 'ความน่าจะเป็น',
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
          },
        },
      });
    }
  }

  updateData() {
    this.jsonArray = [20, 20, 20, 20, 20];
    this.setData(this.chart, this.jsonArray);
  }

  setData(chart: any, data = []) {
    const scoreRanges = this.calculateScoreRanges(
      this.dashboardData,
      this.scoreType
    );

    const labels =
      this.scoreType === '' ? this.chartLabels : this.chartLabels_ScoreType;

    let doughnutData = [0, 0, 0, 0, 0, 0];

    doughnutData[0] = scoreRanges['0-39'] || 0;
    doughnutData[1] = scoreRanges['40-49'] || 0;
    doughnutData[2] = scoreRanges['50-59'] || 0;
    doughnutData[3] = scoreRanges['60-69'] || 0;
    doughnutData[4] = scoreRanges['70-79'] || 0;
    doughnutData[5] = scoreRanges['80+'] || 0;

    if (labels === this.chartLabels_ScoreType) {
      doughnutData = [doughnutData[0], doughnutData[5]];
    }

    chart.data.labels = labels;
    chart.data.datasets[0].data = doughnutData;

    chart.update();
  }

  refreshDashboard = () => {
    this.cdr.detectChanges();
  };

  updateChartData() {
    if (!this.dashboardData || this.dashboardData.length === 0) {
      this.jsonArray = [0, 0, 0, 0, 0, 0];
      this.doughnutChartData.datasets[0].data = [0, 0, 0, 0, 0, 0];
      this.avgScore = 0;
      this.minScore = 0;
      this.maxScore = 0;
      this.stdDev = 0;
      this.studentCount = 0;

      this.updateBellCurve();

      this.refreshDashboard();
      return;
    }

    const totalScore = this.dashboardData[0]?.total_score;
    if (!totalScore) {
      return;
    }

    const scoreRanges = this.calculateScoreRanges(
      this.dashboardData,
      this.scoreType
    );
    this.doughnutChartData.datasets[0].data = [
      scoreRanges['0-39'] || 0,
      scoreRanges['40-49'] || 0,
      scoreRanges['50-59'] || 0,
      scoreRanges['60-69'] || 0,
      scoreRanges['70-79'] || 0,
      scoreRanges['80+'] || 0,
    ];

    this.avgScore = totalScore.avgTotalScore;
    this.minScore = totalScore.minTotalScore;
    this.maxScore = totalScore.maxTotalScore;
    this.stdDev = totalScore.stdTotalScore;
    this.studentCount = totalScore.numberOfStudents;

    this.updateBellCurve();
    this.refreshDashboard();
  }

  calculateScoreRanges(data: any[], scoreType: string): any {
    const ranges = {
      '0-39': 0,
      '40-49': 0,
      '50-59': 0,
      '60-69': 0,
      '70-79': 0,
      '80+': 0,
    };

    if (Array.isArray(data)) {
      const studentData: any[] =
        data.find((item) => Array.isArray(item.studentScore))?.studentScore ||
        [];

      studentData.forEach((student) => {
        let totalScore = 0;

        if (scoreType === 'คะแนนกลางภาค') {
          totalScore = student.midterm_score || 0;
        } else if (scoreType === 'คะแนนปลายภาค') {
          totalScore = student.final_score || 0;
        } else if (scoreType === 'คะแนนระหว่างเรียน') {
          totalScore = student.accumulated_score || 0;
        } else {
          totalScore =
            (student.accumulated_score || 0) +
            (student.midterm_score || 0) +
            (student.final_score || 0);
        }

        if (totalScore >= 0 && totalScore <= 39) ranges['0-39']++;
        else if (totalScore >= 40 && totalScore <= 49) ranges['40-49']++;
        else if (totalScore >= 50 && totalScore <= 59) ranges['50-59']++;
        else if (totalScore >= 60 && totalScore <= 69) ranges['60-69']++;
        else if (totalScore >= 70 && totalScore <= 79) ranges['70-79']++;
        else if (totalScore >= 80) ranges['80+']++;
      });
    }

    return ranges;
  }

  updateBellCurve() {
    if (this.bellCurveChart) {
      this.bellCurveChart.data.datasets[0].data = this.generateBellCurveData();
      this.bellCurveChart.update();
    }
  }

  generateBellCurveData(): number[] {
    const mean = this.avgScore || 0;
    const stdDev = this.stdDev || 0;
    const factor = 1 / (stdDev * Math.sqrt(2 * Math.PI));

    return this.bellCurveLabels.map((x) => {
      const exponent = -0.5 * Math.pow((x - mean) / stdDev, 2);
      return factor * Math.exp(exponent) * 100;
    });
  }

  loadDashboardStats = (): void => {
    this.DashboardService.getDashboardStats({}).subscribe((response: any) => {
      if (response.isSuccess) {
        const data = response.objectResponse;

        this.avgScore = data[0].final_score.avgFinalScore;
        this.minScore = data[0].final_score.minFinalScore;
        this.maxScore = data[0].final_score.maxFinalScore;
        this.stdDev = data[0].final_score.stdFinalScore;
        this.studentCount = data[0].final_score.numberOfStudents;

        const scoreRanges = this.calculateScoreRanges(data, this.scoreType);
        this.doughnutChartData.datasets[0].data = [
          scoreRanges['0-39'] || 0,
          scoreRanges['40-49'] || 0,
          scoreRanges['50-59'] || 0,
          scoreRanges['60-69'] || 0,
          scoreRanges['70-79'] || 0,
          scoreRanges['80+'] || 0,
        ];

        this.updateBellCurve();

        this.refreshDashboard();
      }
    });
  };
}
