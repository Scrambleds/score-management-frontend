import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { environment } from '../../../environments/environment';
import { ScoreAnnouncementService } from '../../services/score-announcement/score-announcement.service';
import { UserService } from '../../services/sharedService/userService/userService.service';
import { Modal } from 'bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { BehaviorSubject, Subscription, switchMap } from 'rxjs';
import { CacheService } from '../../core/services/cache.service';
import { TranslationService } from '../../core/services/translation.service';
import { SignalRService } from '../../services/sharedService/signalRService/signal-r.service';

// @ts-ignore
const $: any = window['$'];

@Component({
  selector: 'app-modal-send-mail',
  standalone: false,

  templateUrl: './modal-send-mail.component.html',
  styleUrl: './modal-send-mail.component.css',
})
export class ModalSendMailComponent implements OnInit, OnChanges {
  @Output() emailStatusChanged = new EventEmitter<boolean>(); // EventEmitter สำหรับส่งค่ากลับไปยัง parent component

  messageText: string = ''; // ข้อความใน textarea
  emailSubject: string = ''; // ข้อความใน input subject
  selectedVariable: any = null; // ตัวแปรที่เลือกจาก select กำหนดเป็น null เพื่อแสดง placeholder
  canAddVariable: boolean = false; // ควบคุมการ enabled ปุ่ม
  focusedField: 'textarea' | 'subject' | null = null; // ฟิลด์ที่กำลัง focus อยู่
  language: string = 'th'; // ค่าภาษาเริ่มต้น
  templateName: string = '';
  currentEmail: string = '';
  currentDefaultTemplate: any = null;
  currentSubject: {
    subject_id: string;
    academic_year: number;
    semester: number;
    section: number;
  } = {
    subject_id: '',
    academic_year: 0,
    semester: 0,
    section: 0,
  };

  placeholderList: any[] = [];
  privateTemplateList: any[] = [];
  basicTemplateList: any[] = [];
  allTemplateList: any[] = [];
  defaultTemplate: any = null;

  //BehivorSubject
  private refreshTemplates$ = new BehaviorSubject<void>(undefined);

  //flg
  isCreateTemplateSubmited: boolean = false;
  isSendMailSubmited: boolean = false;
  // @Input() isSendPerPerson: boolean = false;
  isSendPerPerson: boolean = false;

  //viewchild
  @ViewChild('modal') modal: ElementRef | undefined;

  //form
  public createTemplateForm: FormGroup;

  //current student data
  currentStudentData: any = [];

  //progress
  successCount = 0;
  failCount = 0;
  private progressSubscription!: Subscription;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isSendPerPerson']) {
      // ทำบางอย่างเมื่อค่า isSendPerPerson เปลี่ยนแปลง
      console.log('isSendPerPerson changed:', this.isSendPerPerson);
    }
  }

  //interface
  constructor(
    private http: HttpClient,
    private scoreAnnouncementService: ScoreAnnouncementService,
    private userService: UserService,
    private renderer: Renderer2,
    private el: ElementRef,
    private fb: FormBuilder,
    private cacheService: CacheService,
    private cdr: ChangeDetectorRef,
    private translationService: TranslationService,
    private signalRService: SignalRService
  ) {
    this.createTemplateForm = this.fb.group({
      nameTemplate: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // ดึงค่า language จาก localStorage
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      this.language = savedLanguage; // กำหนดภาษาจาก localStorage
    }
    this.loadEmailPlaceholder();
    // this.loadEmailTemplate();
    // รอให้ userInfo ถูกตั้งค่าใน localStorage
    this.waitForUserInfo().then(() => {
      console.log(localStorage.getItem('userInfo')); // userInfo พร้อมใช้งานแล้ว

      this.refreshTemplates$
        .pipe(
          switchMap(() =>
            this.scoreAnnouncementService.loadEmailTemplate(
              this.userService.username
            )
          )
        )
        .subscribe((resp: any) => {
          this.basicTemplateList = resp.basicTemplates;
          this.privateTemplateList = resp.privateTemplates;
          this.allTemplateList = [
            ...this.privateTemplateList,
            ...this.basicTemplateList,
          ];
          this.currentDefaultTemplate = resp.defaultTemplates;
          // this.initDefaultTemplate(this.currentDefaultTemplate);
        });
    });
    // Subscribe เพื่อรับ progress updates
    this.progressSubscription = this.signalRService.progress$.subscribe(
      (progress) => {
        this.successCount = progress.successCount;
        this.failCount = progress.failCount;
      }
    );
  }

  //load MasterData
  loadEmailPlaceholder(): void {
    this.scoreAnnouncementService.loadEmailPlaceholder().subscribe((resp) => {
      console.log(resp);
      this.placeholderList = resp;
    });
  }

  // loadEmailTemplate(): void {
  //   this.scoreAnnouncementService
  //     .loadEmailTemplate('pamornpon')
  //     .subscribe((resp: any) => {
  //       this.basicTemplateList = resp.basicTemplates;
  //       this.privateTemplateList = resp.privateTemplates;
  //       this.allTemplateList = [
  //         ...this.privateTemplateList,
  //         ...this.basicTemplateList,
  //       ];
  //       this.currentDefaultTemplate = resp.defaultTemplates;
  //       console.log(this.basicTemplateList);
  //       console.log(this.privateTemplateList);
  //       console.log(this.currentDefaultTemplate);

  //       // เรียก initBasicTemplate หลังจากโหลดข้อมูลเสร็จ
  //       this.initDefaultTemplate(this.currentDefaultTemplate);
  //     });
  // }

  // เมื่อ textarea ได้ focus
  onTextareaFocus(): void {
    this.canAddVariable = true;
    this.focusedField = 'textarea';
  }

  // เมื่อ input subject ได้ focus
  onSubjectFocus(): void {
    this.canAddVariable = true;
    this.focusedField = 'subject';
  }

  // เมื่อ focus หลุดจาก textarea หรือ input
  onBlur(): void {
    setTimeout(() => {
      // this.canAddVariable = false;
      // this.focusedField = null;
    }, 250);
  }

  // ฟังก์ชันเพิ่มตัวแปร
  addVariable(): void {
    if (!this.selectedVariable) return;

    if (this.focusedField === 'textarea') {
      this.insertVariableIntoTextarea();
    } else if (this.focusedField === 'subject') {
      this.insertVariableIntoSubject();
    }

    // this.selectedVariable = ''; // เคลียร์ตัวเลือก
  }

  // แทรกตัวแปรใน textarea
  private insertVariableIntoTextarea(): void {
    const textarea = document.getElementById(
      'emailMessage'
    ) as HTMLTextAreaElement;

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const beforeCursor = this.messageText.substring(0, start);
      const afterCursor = this.messageText.substring(end);

      this.messageText = beforeCursor + this.selectedVariable + afterCursor;

      const newCursorPos = start + this.selectedVariable.length;
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      });
    }
  }

  // แทรกตัวแปรใน input subject
  private insertVariableIntoSubject(): void {
    const input = document.getElementById('emailSubject') as HTMLInputElement;

    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;

      const beforeCursor = this.emailSubject.substring(0, start);
      const afterCursor = this.emailSubject.substring(end);

      this.emailSubject = beforeCursor + this.selectedVariable + afterCursor;

      const newCursorPos = start + this.selectedVariable.length;
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(newCursorPos, newCursorPos);
      });
    }
  }

  openModal(isPerson: boolean, rowData: any[], subjectData: any): void {
    this.isSendPerPerson = isPerson;
    if (this.isSendPerPerson === true) {
      this.currentEmail = rowData[0].email;
    }
    const modal = new Modal(this.modal?.nativeElement);
    console.log('person -> ', isPerson);
    this.initDefaultTemplate(this.currentDefaultTemplate);
    this.cdr.detectChanges(); // บังคับให้ Angular re-render
    modal.show();
    // $(this.modal?.nativeElement).modal('show');
    console.log('show modal');
    this.updateCurrentSubject(subjectData); //update current Subject
    if (rowData && rowData.length > 0) {
      // this.currentStudentData = rowData;
      rowData.forEach((row, index) => {
        this.currentStudentData.push(row.student_id);
      });
      console.log('open Modal currentStudentData => ', this.currentStudentData);
    }
  }

  closeModal(): void {
    // $(this.modal?.nativeElement).modal('hide');
    this.currentEmail = '';
    this.currentStudentData = [];
    this.emailSubject = '';
    this.messageText = '';

    // const modal = new Modal(this.modal?.nativeElement);
    if (this.modal) {
      const modalInstance = Modal.getInstance(this.modal.nativeElement);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
    // modal?.hide();
    console.warn('modal hide');
  }

  //template

  // เรียกใช้งานเพื่อ refresh template
  refreshTemplates(): void {
    this.refreshTemplates$.next();
  }

  initDefaultTemplate(defaultTemplate: any): void {
    console.log(defaultTemplate);
    console.log(this.allTemplateList);

    if (defaultTemplate?.defaultTemplate_id != null) {
      let templateKey: number = defaultTemplate.defaultTemplate_id;
      let template = this.allTemplateList.find(
        (t) => t.templateId === templateKey
      );
      console.log(template);
      if (template) {
        // แทนที่ค่าใน subject
        this.emailSubject = template.detail.subject;

        // แทนที่ค่าใน body
        this.messageText = template.detail.body;
      }
    } else {
      console.log('not found default template');
    }
  }

  loadBasicTemplate(templateKey: number): void {
    let template = this.basicTemplateList.find(
      (t) => t.templateId === templateKey
    );
    console.log(template);
    if (template) {
      // แทนที่ค่าใน subject
      this.emailSubject = template.detail.subject;

      // แทนที่ค่าใน body
      this.messageText = template.detail.body;
    }
  }

  loadPrivateTemplate(templateKey: number): void {
    let template = this.privateTemplateList.find(
      (t) => t.templateId === templateKey
    );
    if (template) {
      // แทนที่ค่าใน subject
      this.emailSubject = template.detail.subject;

      // แทนที่ค่าใน body
      this.messageText = template.detail.body;
    }
  }

  setDefaultTemplate(templateKey: number): void {
    const okBtnText = this.translationService.getTranslation('btn_ok');
    const closeBtnText = this.translationService.getTranslation('btn_close');
    console.log(`setDefault template : ${templateKey}`);
    const payload = {
      template_id: templateKey,
      username: this.userService.username, // Replace with actual username
    };
    let template = this.allTemplateList.find(
      (t) => t.templateId === templateKey
    );
    this.scoreAnnouncementService.setDefaultTemplate(payload).subscribe(
      (response) => {
        if (response.isSuccess) {
          const successTitle = this.translationService.getTranslation(
            'scoreannouncement_swalSetDefaultTemplateSuccess_title'
          );
          const successText = this.translationService.getTranslation(
            'scoreannouncement_swalSetDefaultTemplateSuccess_text',
            { templateName: template.templateName }
          );

          Swal.fire({
            title: successTitle,
            text: successText,
            icon: 'success',
            confirmButtonColor: 'var(--primary-color)',
            confirmButtonText: okBtnText,
          })
            .then((result) => {
              if (result.isConfirmed) {
                // หากคลิก "ตกลง"
                console.log('success : ', response.messageDesc);
              }
            })
            .then(() => {
              this.cacheService.clearCacheForUrl(
                '/api/MasterData/EmailTemplate'
              );
              this.refreshTemplates();
            });
        } else {
          const failTitle = this.translationService.getTranslation(
            'scoreannouncement_swalSetDefaultTemplateFail_title'
          );

          Swal.fire({
            title: failTitle,
            text: response.message.messageDescription,
            icon: 'error',
            confirmButtonColor: 'var(--secondary-color)',
            confirmButtonText: closeBtnText,
          }).then((result) => {
            if (result.isConfirmed) {
              // หากคลิก "ตกลง"
              console.log('error : ', response.messageDesc);
            }
          });
        }
      },
      (error) => {
        console.error('Error creating template:', error);
        const title = this.translationService.getTranslation(
          'swalServerError_title'
        );
        const text = this.translationService.getTranslation(
          'swalServerError_text'
        );

        Swal.fire({
          title: title,
          text: text,
          icon: 'error',
          confirmButtonColor: 'var(--secondary-color)',
          confirmButtonText: closeBtnText,
        });
      }
    );
  }

  createTemplate() {
    console.log('createTemplate');
    const payload = {
      template_name: '',
      subject: this.emailSubject,
      body: this.messageText,
      username: this.userService.username, // Replace with actual username
    };
    this.scoreAnnouncementService.createEmailTemplate(payload).subscribe(
      (response) => {
        console.log('Response : ', response);
      },
      (error) => {
        console.error('Error creating template:', error);
      }
    );
    this.toggleTemplateDialog(false); // ปิด dialog หลังบันทึก
  }

  updateTemplate(templateKey: number) {
    console.log(`update Template : ${templateKey}`);
    const okBtnText = this.translationService.getTranslation('btn_ok');
    const closeBtnText = this.translationService.getTranslation('btn_close');
    const cancleBtnText = this.translationService.getTranslation('btn_cancel');
    const payload = {
      template_id: templateKey, // Assuming templateKey maps to template_id
      subject: this.emailSubject,
      body: this.messageText,
      username: this.userService.username, // Replace with actual username
    };
    let template = this.privateTemplateList.find(
      (t) => t.templateId === templateKey
    );
    const warnTitle = this.translationService.getTranslation(
      'scoreannouncement_swalWarningUpdateTemplate_title',
      { templateName: template.templateName }
    );
    const warnText = this.translationService.getTranslation(
      'scoreannouncement_swalWarningUpdateTemplate_text'
    );

    Swal.fire({
      title: warnTitle,
      text: warnText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--primary-color)',
      confirmButtonText: okBtnText,
      cancelButtonColor: 'var(--secondary-color)',
      cancelButtonText: cancleBtnText,
    }).then((result) => {
      if (result.isConfirmed) {
        // หากคลิก "ตกลง"
        console.log('ข้อมูลถูกแก้ไขแล้ว');
        this.scoreAnnouncementService.updateEmailTemplate(payload).subscribe(
          (response) => {
            if (response.isSuccess) {
              this.cacheService.clearCacheForUrl(
                '/api/MasterData/EmailTemplate'
              );
              this.refreshTemplates();
              const successTitle = this.translationService.getTranslation(
                'scoreannouncement_swalUpdateTemplateSuccess_title'
              );
              const successText = this.translationService.getTranslation(
                'scoreannouncement_swalUpdateTemplateSuccess_text',
                { templateName: template.templateName }
              );

              Swal.fire({
                title: successTitle,
                text: successText,
                icon: 'success',
                confirmButtonColor: 'var(--primary-color)',
                confirmButtonText: okBtnText,
              }).then((result) => {
                if (result.isConfirmed) {
                  // หากคลิก "ตกลง"
                  console.log('success : ', response.messageDesc);
                }
              });
              console.log('Response : ', response);
            } else {
              console.log('fail Response : ', response);
              const failTitle = this.translationService.getTranslation(
                'scoreannouncement_swalUpdateTemplateFail_title'
              );

              Swal.fire({
                title: failTitle,
                text: response.message.messageDescription,
                icon: 'error',
                confirmButtonColor: 'var(--secondary-color)',
                confirmButtonText: closeBtnText,
              }).then((result) => {
                if (result.isConfirmed) {
                  // หากคลิก "ตกลง"
                  console.log('error : ', response.messageDesc);
                }
              });
            }
          },
          (error) => {
            console.error('Error updating template:', error);
            const title = this.translationService.getTranslation(
              'swalServerError_title'
            );
            const text = this.translationService.getTranslation(
              'swalServerError_text'
            );
            Swal.fire({
              title: title,
              text: text,
              icon: 'error',
              confirmButtonColor: 'var(--secondary-color)',
              confirmButtonText: closeBtnText,
            });
          }
        );
      } else if (result.isDismissed) {
        // หากคลิก "ยกเลิก"
        console.log('การบันทึกถูกยกเลิก');
      }
    });
  }

  deleteTemplate(templateKey: number) {
    const okBtnText = this.translationService.getTranslation('btn_ok');
    const closeBtnText = this.translationService.getTranslation('btn_close');
    const deleteBtnText = this.translationService.getTranslation('btn_delete');
    const cancleBtnText = this.translationService.getTranslation('btn_cancel');

    console.log(`deleteTemplate : ${templateKey}`);
    const payload = {
      template_id: templateKey, // Assuming templateKey maps to template_id
      username: this.userService.username, // Replace with actual username
    };
    let template = this.privateTemplateList.find(
      (t) => t.templateId === templateKey
    );
    const warnTitle = this.translationService.getTranslation(
      'scoreannouncement_swalWarningDeleteTemplate_title',
      { templateName: template.templateName }
    );
    const warnText = this.translationService.getTranslation(
      'scoreannouncement_swalWarningDeleteTemplate_text'
    );
    Swal.fire({
      title: warnTitle,
      text: warnText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--danger-color)',
      confirmButtonText: deleteBtnText,
      cancelButtonColor: 'var(--secondary-color)',
      cancelButtonText: cancleBtnText,
    }).then((result) => {
      if (result.isConfirmed) {
        // หากคลิก "ตกลง"
        console.log('ข้อมูลถูกลบแล้ว');
        this.scoreAnnouncementService.deleteEmailTemplate(payload).subscribe(
          (response) => {
            if (response.isSuccess) {
              this.cacheService.clearCacheForUrl(
                '/api/MasterData/EmailTemplate'
              );
              this.refreshTemplates();
              const successTitle = this.translationService.getTranslation(
                'scoreannouncement_swalDeleteTemplateSuccess_title'
              );
              const successText = this.translationService.getTranslation(
                'scoreannouncement_swalDeleteTemplateSuccess_text',
                { templateName: template.templateName }
              );
              Swal.fire({
                title: successTitle,
                text: successText,
                icon: 'success',
                confirmButtonColor: 'var(--primary-color)',
                confirmButtonText: okBtnText,
              }).then((result) => {
                if (result.isConfirmed) {
                  // หากคลิก "ตกลง"
                  console.log('success : ', response.messageDesc);
                }
              });
            } else {
              console.log('fail Response : ', response);
              const failTitle = this.translationService.getTranslation(
                'scoreannouncement_swalDeleteTemplateFail_title'
              );
              Swal.fire({
                title: failTitle,
                text: response.message.messageDescription,
                icon: 'error',
                confirmButtonColor: 'var(--primary-color)',
                confirmButtonText: closeBtnText,
              }).then((result) => {
                if (result.isConfirmed) {
                  // หากคลิก "ตกลง"
                  console.log('success : ', response.messageDesc);
                }
              });
            }
          },
          (error) => {
            console.error('Error updating template:', error);
            const title = this.translationService.getTranslation(
              'swalServerError_title'
            );
            const text = this.translationService.getTranslation(
              'swalServerError_text'
            );
            Swal.fire({
              title: title,
              text: text,
              icon: 'error',
              confirmButtonColor: 'var(--secondary-color)',
              confirmButtonText: closeBtnText,
            });
          }
        );
      } else if (result.isDismissed) {
        // หากคลิก "ยกเลิก"
        console.log('การบันทึกถูกยกเลิก');
      }
    });
  }

  //email placeholder
  // ฟังก์ชันสำหรับแสดงข้อความตามภาษา
  getDisplayText(item: any): string {
    return this.language === 'en' ? item.desc_en : item.desc_th;
  }

  insertTab(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      event.preventDefault(); // ป้องกันการเปลี่ยน focus
      const textarea = event.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // เพิ่ม tab (หรือ whitespace) ในตำแหน่งที่ cursor อยู่
      textarea.value =
        textarea.value.substring(0, start) +
        '\t' +
        textarea.value.substring(end);

      // เลื่อน cursor ไปที่ตำแหน่งหลังจาก tab ที่เพิ่มเข้าไป
      textarea.selectionStart = textarea.selectionEnd = start + 1;
    }
  }

  // Method ที่ถูกเรียกเมื่อกดปุ่ม "ส่งอีเมล"
  sendEmail() {
    const total = this.currentStudentData.length; // จำนวนรายการทั้งหมด
    let progressSwal: any; // ตัวแปรเก็บ Swal Instance

    // แสดง Swal แบบ Progress ไม่ให้ปิดได้
    const spinnerIcon = `
    <svg width="80" height="80" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="20" r="15" fill="#25b09b">
        <animateTransform attributeName="transform" type="rotate"
          values="0 50 50; 90 50 50; 90 50 50; 180 50 50; 180 50 50; 270 50 50; 270 50 50; 360 50 50; 360 50 50;"
          keyTimes="0;0.125;0.25;0.375;0.5;0.625;0.75;0.875;1"
          dur="4s" repeatCount="indefinite"/>
      </circle>
    <circle cx="20" cy="50" r="15" fill="#25b09b">
        <animateTransform attributeName="transform" type="rotate"
          values="0 50 50; 90 50 50; 90 50 50; 180 50 50; 180 50 50; 270 50 50; 270 50 50; 360 50 50; 360 50 50;"
          keyTimes="0;0.125;0.25;0.375;0.5;0.625;0.75;0.875;1"
          dur="4s" repeatCount="indefinite"/>
      </circle>
      <circle cx="80" cy="50" r="15" fill="#25b09b">
        <animateTransform attributeName="transform" type="rotate"
          values="0 50 50; 90 50 50; 90 50 50; 180 50 50; 180 50 50; 270 50 50; 270 50 50; 360 50 50; 360 50 50;"
          keyTimes="0;0.125;0.25;0.375;0.5;0.625;0.75;0.875;1"
          dur="4s" repeatCount="indefinite"/>
      </circle>
      <circle cx="50" cy="80" r="15" fill="#25b09b">
        <animateTransform attributeName="transform" type="rotate"
          values="0 50 50; 90 50 50; 90 50 50; 180 50 50; 180 50 50; 270 50 50; 270 50 50; 360 50 50; 360 50 50;"
          keyTimes="0;0.125;0.25;0.375;0.5;0.625;0.75;0.875;1"
          dur="4s" repeatCount="indefinite"/>
      </circle>
    </svg>
    `;
    const progressText = this.translationService.getTranslation(
      'scoreannouncement_swalSendMailProcessing_text',
      { processed: '0', total: total.toString() }
    );
    Swal.fire({
      title: this.translationService.getTranslation(
        'scoreannouncement_swalSendMailProcessing_title'
      ),
      iconHtml: spinnerIcon, // ใช้ custom spinner
      html: `<p id="swal-progress-text">${progressText}</p>`, // ใช้ <p> เพื่ออัปเดตเฉพาะส่วนนี้
      allowEscapeKey: false,
      showConfirmButton: false,
      customClass: {
        icon: 'no-border',
      },
      allowOutsideClick: () => {
        const popup = Swal.getPopup() as HTMLElement;
        popup.classList.remove('swal2-show');
        setTimeout(() => {
          popup.classList.add('animate__animated', 'animate__headShake');
          popup.style.animation = 'headShake 1s ease-in-out';
        });
        setTimeout(() => {
          popup.classList.remove('animate__animated', 'animate__headShake');
        }, 500);
        return false;
      },
      didOpen: () => {
        progressSwal = Swal.getPopup();
      },
    });
    this.signalRService.startProgressConnection();
    // ติดตาม progress และอัปเดต Swal
    this.signalRService.progress$.subscribe(({ successCount, failCount }) => {
      if (progressSwal) {
        const progressTextEm = document.getElementById('swal-progress-text');
        if (progressTextEm) {
          const text = this.translationService.getTranslation(
            'scoreannouncement_swalSendMailProcessing_text',
            {
              processed: (successCount + failCount).toString(),
              total: total.toString(),
            }
          );
          progressTextEm.innerHTML = text;
        }
      }
    });

    const okBtnText = this.translationService.getTranslation('btn_ok');
    const closeBtnText = this.translationService.getTranslation('btn_close');
    console.log('sendEmail: CurrentSubject => ', this.currentSubject);
    const payload = {
      subjectDetail: this.currentSubject,
      student_id: this.currentStudentData,
      //username teacher
      username: this.userService.username,
      emailDetail: {
        subjectEmail: this.emailSubject,
        contentEmail: this.messageText,
      },
    };

    console.log('Email Payload:', payload); // แสดงค่าใน console

    this.scoreAnnouncementService.sendMail(payload).subscribe(
      (response) => {
        this.createTemplateForm.reset();
        this.isTemplateDialogVisible = false;
        console.log('Success', response);
        if (response.isSuccess) {
          const successTitle = this.translationService.getTranslation(
            'scoreannouncement_swalSendMailSuccess_title'
          );
          const successText = this.translationService.getTranslation(
            'scoreannouncement_swalSendMailSuccess_text',
            { number: this.currentStudentData.length.toString() }
          );
          Swal.fire({
            title: successTitle,
            text: successText,
            icon: 'success',
            confirmButtonColor: 'var(--primary-color)',
            confirmButtonText: okBtnText,
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then((result) => {
            if (result.isConfirmed) {
              // หากคลิก "ตกลง"
              console.log('success : ', response.messageDesc);
              this.emailStatusChanged.emit(true); // ส่งค่า true เมื่อสำเร็จ
            }
          });
        } else {
          const failTitle = this.translationService.getTranslation(
            'scoreannouncement_swalSendMailFail_title'
          );
          Swal.fire({
            title: failTitle,
            html: response.message.messageDescription.replace(/\n/g, '<br>'), // แปลง \n เป็น <br>
            icon: 'error',
            confirmButtonColor: 'var(--secondary-color)',
            confirmButtonText: closeBtnText,
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then((result) => {
            if (result.isConfirmed) {
              // หากคลิก "ตกลง"
              console.log('error : ', response.messageDesc);
              this.emailStatusChanged.emit(true); // ส่งค่า true ไม่สำเร็จ
            }
          });
        }
        this.signalRService.stopProgressConnection();
      },
      (error) => {
        this.signalRService.stopProgressConnection();
        const title = this.translationService.getTranslation(
          'swalServerError_title'
        );
        const text = this.translationService.getTranslation(
          'swalServerError_text'
        );
        Swal.fire({
          title: title,
          text: text,
          icon: 'error',
          confirmButtonColor: 'var(--secondary-color)',
          confirmButtonText: closeBtnText,
        });
      },
      () => {
        this.isCreateTemplateSubmited = false; // reset flg
      }
    );
  }

  isTemplateDialogVisible = false;

  toggleTemplateDialog(visible: boolean): void {
    this.isTemplateDialogVisible = visible;
    const bodyChildren = document.body.children;
    for (const child of Array.from(bodyChildren)) {
      if (child.id !== 'createTemplateDialog' && visible) {
        this.renderer.setAttribute(child, 'aria-hidden', 'true');
      } else if (child.id !== 'createTemplateDialog' && !visible) {
        this.renderer.removeAttribute(child, 'aria-hidden');
      }
    }

    // Focus first element in the dialog when opened
    if (visible) {
      //set delay for avoid DOM can't build it in time
      setTimeout(() => {
        const dialog = this.el.nativeElement.querySelector(
          '#createTemplateDialog'
        );
        if (dialog) {
          const focusableElements = dialog.querySelectorAll(
            'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
          );
          //move focus to first element in dialog
          (focusableElements[0] as HTMLElement)?.focus();
        }
      });
    }
  }

  // Prevent tab focus outside modal dialog create template
  trapFocus(event: KeyboardEvent): void {
    const dialog = this.el.nativeElement.querySelector('#createTemplateDialog');
    const focusableElements = dialog.querySelectorAll(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.key === 'Tab') {
      if (event.shiftKey) {
        // Shift + Tab: Move focus to the last element if on the first element
        if (document.activeElement === firstElement) {
          event.preventDefault();
          (lastElement as HTMLElement).focus();
        }
      } else {
        // Tab: Move focus to the first element if on the last element
        if (document.activeElement === lastElement) {
          event.preventDefault();
          (firstElement as HTMLElement).focus();
        }
      }
    }
  }

  onSaveCreateTemplate(): void {
    // Logic บันทึกข้อมูล
    if (this.isCreateTemplateSubmited) {
      return;
    }

    this.isCreateTemplateSubmited = true;
    if (this.createTemplateForm.valid) {
      const closeBtnText = this.translationService.getTranslation('btn_close');
      const okBtnText = this.translationService.getTranslation('btn_ok');

      const formData = this.createTemplateForm.value;
      console.log(formData);
      console.log('submit name template is: ', formData.nameTemplate);
      const payload = {
        template_name: formData.nameTemplate,
        subject: this.emailSubject,
        body: this.messageText,
        username: this.userService.username,
      };
      this.scoreAnnouncementService.createEmailTemplate(payload).subscribe(
        (response) => {
          this.createTemplateForm.reset();
          this.isTemplateDialogVisible = false;
          console.log('Success', response);
          if (response.isSuccess) {
            const successTitle = this.translationService.getTranslation(
              'scoreannouncement_swalCreateTemplateSuccess_title'
            );
            const successText = this.translationService.getTranslation(
              'scoreannouncement_swalCreateTemplateSuccess_text',
              { templateName: formData.nameTemplate }
            );
            Swal.fire({
              title: successTitle,
              text: successText,
              icon: 'success',
              confirmButtonColor: 'var(--primary-color)',
              confirmButtonText: okBtnText,
            }).then((result) => {
              if (result.isConfirmed) {
                // หากคลิก "ตกลง"
                this.cacheService.clearCacheForUrl(
                  '/api/MasterData/EmailTemplate'
                );
                this.refreshTemplates();
                console.log('success : ', response.messageDesc);
              }
            });
          } else {
            const failTitle = this.translationService.getTranslation(
              'scoreannouncement_swalCreateTemplateFail_title'
            );
            Swal.fire({
              title: failTitle,
              text: response.message.messageDescription,
              icon: 'error',
              confirmButtonColor: 'var(--secondary-color)',
              confirmButtonText: closeBtnText,
            }).then((result) => {
              if (result.isConfirmed) {
                // หากคลิก "ตกลง"
                console.log('error : ', response.messageDesc);
              }
            });
          }
        },
        (error) => {
          console.log('Error', error);
          const title = this.translationService.getTranslation(
            'swalServerError_title'
          );
          const text = this.translationService.getTranslation(
            'swalServerError_text'
          );
          Swal.fire({
            title: title,
            text: text,
            icon: 'error',
            confirmButtonColor: 'var(--secondary-color)',
            confirmButtonText: closeBtnText,
          });
        },
        () => {
          this.isCreateTemplateSubmited = false; // reset flg
        }
      );
      // this.createTemplateForm.reset();
      // this.isTemplateDialogVisible = false;
    } else {
      console.log('กรุณากรอกข้อมูลให้ครบถ้วน');
    }
  }

  onCancel(): void {
    this.isTemplateDialogVisible = false;
    // Logic ยกเลิกการทำงาน
    this.createTemplateForm.reset();
    // // this.isTemplateDialogVisible = false;
    // const delay = 300; // ระยะเวลา animation ใน ms
    // setTimeout(() => {
    //   this.createTemplateForm.reset();
    // }, delay);
  }

  // สร้างฟังก์ชันรอ userInfo
  private waitForUserInfo(): Promise<void> {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          clearInterval(interval);
          resolve(); // ข้อมูลพร้อมแล้ว
        }
      }, 100); // ตรวจสอบทุก 100 มิลลิวินาที
    });
  }

  //update subject from search
  updateCurrentSubject(subjectData: {
    subject_id: string;
    academic_year: number;
    semester: number;
    section: number;
  }) {
    console.log('onUpdateCurrentSubject:subjectData => ', subjectData);
    this.currentSubject = subjectData;
    console.log(
      'onUpdateCurrentSubject:currentSubject => ',
      this.currentSubject
    );
  }
}
