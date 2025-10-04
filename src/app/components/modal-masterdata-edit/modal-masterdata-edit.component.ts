import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Modal } from 'bootstrap';
import { MasterDataService } from '../../services/master-data/master-data.service';
import { UserService } from '../../services/sharedService/userService/userService.service';
import Swal from 'sweetalert2';
import { TranslationService } from '../../core/services/translation.service';
import { CacheService } from '../../core/services/cache.service';

@Component({
  selector: 'app-modal-masterdata-edit',
  standalone: false,
  templateUrl: './modal-masterdata-edit.component.html',
  styleUrls: ['./modal-masterdata-edit.component.css'],
})
export class ModalMasterdataEditComponent implements AfterViewInit, OnChanges {
  form!: FormGroup;
  @ViewChild('modalElement') modalElement: ElementRef | undefined;
  @Output() showChange = new EventEmitter<boolean>();
  modalInstance: Modal | undefined;
  @Input() show = false;
  @Input() byteReference: string | null = null;
  @Input() byteCode: string | null = null;
  @Input() byteDescTH: string | null = null;
  @Input() byteDescEN: string | null = null;
  @Input() activeStatus: string | null = null;
  @Input() statusData: Array<{ id: string; title: string }> = [];
  @Output() updateMasterData = new EventEmitter<any>();

  constructor(
    private fb: FormBuilder,
    private MasterDataService: MasterDataService,
    private UserService: UserService,
    private translate: TranslationService,
    private CacheService: CacheService
  ) {}

  customSearchFn_SearchLan(term: string, item: any): boolean {
    return this.translate.searchFn(term, item);
  }

  ngOnInit() {
    this.form = this.fb.group({
      byte_reference: [
        { value: this.byteReference, disabled: true },
        Validators.required,
      ],
      byte_code: [
        { value: this.byteCode, disabled: true },
        Validators.required,
      ],
      byte_desc_th: [this.byteDescTH, Validators.required],
      byte_desc_en: [this.byteDescEN || '', Validators.required],
      active_status: [this.activeStatus, Validators.required],
    });
  }

  ngAfterViewInit() {
    if (this.modalElement) {
      this.modalInstance = new Modal(this.modalElement.nativeElement);

      this.modalElement.nativeElement.addEventListener(
        'hidden.bs.modal',
        () => {
          this.show = false;
          this.modalInstance = new Modal(this.modalElement!.nativeElement);
          this.showChange.emit(false);
        }
      );
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.form) {
      if (changes['byteReference']) {
        this.form.get('byte_reference')?.setValue(this.byteReference);
      }
      if (changes['byteCode']) {
        this.form.get('byte_code')?.setValue(this.byteCode);
      }
      if (changes['byteDescTH']) {
        this.form.get('byte_desc_th')?.setValue(this.byteDescTH);
      }
      if (changes['byteDescEN']) {
        this.form.get('byte_desc_en')?.setValue(this.byteDescEN);
      }
      if (changes['activeStatus']) {
        this.form.get('active_status')?.setValue(this.activeStatus);
      }
    }

    if (changes['show'] && !changes['show'].firstChange) {
      if (this.show) {
        if (!this.modalInstance && this.modalElement) {
          this.modalInstance = new Modal(this.modalElement.nativeElement);
        }
        this.modalInstance?.show();
      } else {
        this.modalInstance?.hide();
      }
    }
  }

  OnSaveData() {

    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const Success_title = this.translate.getTranslation('sweet_alert_success');
    const Success_text = this.translate.getTranslation('sweet_alert_edit');
    const Submit_Button = this.translate.getTranslation('btn_ok');
    const Fail_title = this.translate.getTranslation('sweet_alert_fail_title');
    const Fail_text = this.translate.getTranslation('sweet_alert_fail_text');
    const description_duplicated = this.translate.getTranslation('description_duplicated');
    
    const UserEdit = this.UserService.username;
    const formData = this.form.getRawValue();
    formData.update_by = UserEdit;

    this.MasterDataService.updateSystemParam(formData).subscribe({
      next: (response) => {
        console.log('Response: ', response);
        if (
          response.isSuccess &&
          response.message != 'Duplicate description found.'
        ) {
          Swal.fire({
            icon: 'success',
            title: Success_title,
            text: Success_text,
            confirmButtonText: Submit_Button,
            confirmButtonColor: '#007bff',
          }).then((result) => {
            if (result.isConfirmed) {
              this.updateMasterData.emit(formData);
              window.location.reload(); 
            }
          });
          this.CacheService.clearCacheForUrl(
            '/api/MasterData'
          );
          this.CacheService.clearCacheForUrl('/api/LovContant');
          this.closeModal();
        }
      },
      error: (error) => {
        console.error('Error occurred:', error);
        // ตรวจสอบหากมีข้อความ error ที่เกี่ยวข้อง
        if (error.message != 'Duplicate description found.') {
          Swal.fire({
            icon: 'error',
            title: Fail_title,
            text: description_duplicated,
            confirmButtonText: Submit_Button,
            confirmButtonColor: '#007bff',
          });
        }
      },
    });
  }

  // closeModal() {
  //   this.show = false;
  //   this.modalInstance?.hide();
  //   this.modalInstance = undefined;
  //   this.showChange.emit(false);
  // }

  closeModal() {
    this.show = false;
    this.modalInstance?.hide();
    this.form.reset();
    //   this.modalInstance = undefined;
    this.form.get('byte_reference')?.setValue(this.byteReference);
    this.form.get('byte_code')?.setValue(this.byteCode);
    this.form.get('byte_desc_th')?.setValue(this.byteDescTH);
    this.form.get('byte_desc_en')?.setValue(this.byteDescEN);
    this.form.get('active_status')?.setValue(this.activeStatus);
    this.showChange.emit(false);
  }

  // onBackdropClick(event: MouseEvent) {
  //   if (event.target === this.modalElement?.nativeElement) {
  //     this.closeModal();
  //   }
  // }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: KeyboardEvent) {
    if (this.show) {
      this.closeModal();
    }
  }
}