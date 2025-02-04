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
  chartLabels: any = ['0-9', '10-19', '20-29', '30-39', '40+'];
  chartLabels_ScoreType: any = [
    '0-39',
    '40-49',
    '50-59',
    '60-69',
    '70-79',
    '80+',
  ];

  // chartLabels_ScoreType: any = ['0-39', '40+'];

  // cutOut: number = 75;
  backgroundColors: any = [
    '#E15D44',
    '#55B4B0',
    '#DFCFBE',
    '#9B2335',
    '#5B5EA6',
    '#d6a7f5',

    // '#FF6384',
    // '#36A2EB',
    // '#FFCE56',
    // '#AA65D8',
    // '#FFA600',
    // '#80ff80',
  ];
  constructor(
    private DashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {}
  @Input() dashboardData: any;
  @Input() cardValue: any;
  @Input() scoreType: string = '';
  @Input() cardRequested: EventEmitter<any> = new EventEmitter();
  @Input() dashboardDataUpdated: EventEmitter<any> = new EventEmitter();
  bellCurveChart: chartJS.Chart | undefined;

  bellCurveLabels: number[] = Array.from({ length: 101 }, (_, i) => i);

  avgScore!: any;
  minScore!: any;
  maxScore!: any;
  stdDev!: any;
  studentCount!: any;

  // doughnutChartLabels = ['0-39', '40-49', '50-59', '60-69', '70-79', '80+'];
  doughnutChartData = {
    labels: [],
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

  ngOnChanges(changes: SimpleChanges) {
    if (changes['dashboardData'] && changes['dashboardData'].currentValue) {
      // Logic for dashboardData changes, make sure chart data gets updated properly
      this.updateChartData();
      this.setData(this.chart, this.jsonArray);
    }
  }

  ngOnInit(): void {
    this.cardRequested.subscribe((data) => {
      console.log('DATA RECEIVED!!!: ', data);
      this.cardValue = data;
      this.updateChartData();
    });

    this.dashboardDataUpdated.subscribe((data) => {
      this.dashboardData = data;
      this.updateChartData();
    });

    this.resetDashboard();
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
    console.log('DATA!!!!: ', this.cardValue);
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
                  const value = tooltipItem.raw as number; // ใช้ tooltipItem.raw เพื่อดึงค่าจริงของ slice
                  const dataset = tooltipItem.chart.data.datasets[0]
                    .data as number[];
                  const total = dataset.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);

                  return ` ${value} ราย (${percentage}%)`;
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
                text: 'จำนวนนิสิต (คน)',
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
    console.log('DATA!!!!: ', this.cardValue);
    this.jsonArray = [20, 20, 20, 20, 20];
    this.setData(this.chart, this.jsonArray);
  }

  setData(chart: any, data = []) {
    console.log('DATA!!!!: ', this.cardValue);
    const scoreRanges = this.calculateScoreRanges(
      this.dashboardData,
      this.cardValue
    );

    const labels =
      this.cardValue !== 'คะแนนรวม'
        ? this.chartLabels
        : this.chartLabels_ScoreType;
    let doughnutData = [0, 0, 0, 0, 0, 0];

    if (this.cardValue === 'คะแนนรวม') {
      doughnutData = [
        scoreRanges['0-39'] || 0,
        scoreRanges['40-49'] || 0,
        scoreRanges['50-59'] || 0,
        scoreRanges['60-69'] || 0,
        scoreRanges['70-79'] || 0,
        scoreRanges['80+'] || 0,
      ];
    } else {
      doughnutData = [
        scoreRanges['0-9'] || 0,
        scoreRanges['10-19'] || 0,
        scoreRanges['20-29'] || 0,
        scoreRanges['30-39'] || 0,
        scoreRanges['40+'] || 0,
      ];
    }

    // ตรวจสอบว่าเป็น Label แบบไหน แล้วใช้สีที่เหมาะสม
    let backgroundColors = [];
    if (labels === this.chartLabels) {
      backgroundColors = [
        '#E15D44',
        '#55B4B0',
        '#DFCFBE',
        '#9B2335',
        '#5B5EA6',
        '#d6a7f5',
      ];
    } else if (labels === this.chartLabels_ScoreType) {
      backgroundColors = [
        '#E15D44',
        '#55B4B0',
        '#DFCFBE',
        '#9B2335',
        '#5B5EA6',
        '#d6a7f5',
      ];
    } else {
      backgroundColors = [
        '#80ff80',
        '#D2691E',
        '#00FA9A',
        '#DC143C',
        '#4682B4',
      ]; // ค่าเริ่มต้น
    }

    chart.data.labels = labels;
    chart.data.datasets[0].data = doughnutData;
    chart.data.datasets[0].backgroundColor = backgroundColors; // กำหนดสีแบบไดนามิก

    chart.update();
  }

  refreshDashboard = () => {
    this.cdr.detectChanges();
  };

  updateChartData() {
    if (!this.dashboardData || this.dashboardData.length === 0) {
    console.log('MY TYPE:',this.cardValue)
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
      this.cardValue
    );

    this.doughnutChartData.datasets[0].data =
      this.cardValue === 'คะแนนรวม'
        ? [
            scoreRanges['0-39'] || 0,
            scoreRanges['40-49'] || 0,
            scoreRanges['50-59'] || 0,
            scoreRanges['60-69'] || 0,
            scoreRanges['70-79'] || 0,
            scoreRanges['80+'] || 0,
          ]
        : [
            scoreRanges['0-9'] || 0,
            scoreRanges['10-19'] || 0,
            scoreRanges['20-29'] || 0,
            scoreRanges['30-39'] || 0,
            scoreRanges['40+'] || 0,
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
    let ranges: any = {};
    console.log("This is 1: ", data)
    console.log("This is", scoreType)

    if (scoreType === 'คะแนนรวม') {
      ranges = {
        '0-39': 0,
        '40-49': 0,
        '50-59': 0,
        '60-69': 0,
        '70-79': 0,
        '80+': 0,
      };
    } else {
      ranges = {
        '0-9': 0,
        '10-19': 0,
        '20-29': 0,
        '30-39': 0,
        '40+': 0,
      };
    }

    if (!Array.isArray(data)) return ranges;

    const studentData: any[] =
      data.find((item) => Array.isArray(item.studentScore))?.studentScore || [];

    studentData.forEach((student) => {
     console.log("student:", student);
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

      if (scoreType === 'คะแนนรวม') {
        if (totalScore >= 0 && totalScore < 40) ranges['0-39']++;
        else if (totalScore >= 40 && totalScore < 50) ranges['40-49']++;
        else if (totalScore >= 50 && totalScore < 60) ranges['50-59']++;
        else if (totalScore >= 60 && totalScore < 70) ranges['60-69']++;
        else if (totalScore >= 70 && totalScore < 80) ranges['70-79']++;
        else if (totalScore >= 80) ranges['80+']++;
      } else {
        if (totalScore >= 0 && totalScore < 10) ranges['0-9']++;
        else if (totalScore >= 10 && totalScore < 20) ranges['10-19']++;
        else if (totalScore >= 20 && totalScore < 30)
          ranges['20-29']++; // Fix range
        else if (totalScore >= 30 && totalScore < 40)
          ranges['30-39']++; // Fix range
        else if (totalScore >= 40) ranges['40+']++;
      }
    });

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
}