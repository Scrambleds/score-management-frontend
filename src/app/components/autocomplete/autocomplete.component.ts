import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostListener,
  Input,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

@Component({
  selector: 'app-autocomplete',
  standalone: false,

  templateUrl: './autocomplete.component.html',
  styleUrl: './autocomplete.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteComponent),
      multi: true,
    },
  ],
})
export class AutocompleteComponent implements ControlValueAccessor {
  @Input() placeholder: string = '';
  @Input() name: string = '';
  @Input() suggestions: any[] = [];
  @Input() displayKey: string = '';
  @Input() displayFormat?: TemplateRef<any>;
  @Input() widthAuto: boolean = false; // เพิ่ม Input Property
  @Input() disabled: boolean = false; // เพิ่ม Input Property
  @Input() readonly: boolean = false; // เพิ่ม Input Property
  private _value: string = '';

  @Input()
  set value(val: string) {
    this._value = val;
    this.inputValue = this._value; // อัปเดตค่าใน input
    console.log('set value', this.inputValue);
  }
  get value(): string {
    console.log('get value', this._value);
    return this._value;
  }
  @Output() search = new EventEmitter<string>();
  @Output() select = new EventEmitter<any>();

  @ViewChild('autocompleteContainer') autocompleteContainer!: ElementRef;

  inputValue: string = ''; // รับค่าจาก parent component
  isAutocompleteVisible = false;
  dropdownPosition: 'top' | 'bottom' = 'bottom';

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  @HostListener('window:resize')
  onWindowResize(): void {
    this.adjustDropdownPosition();
  }

  writeValue(value: any): void {
    if (value) {
      this.inputValue = value;
      this.onChange(this.inputValue);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onSearch(): void {
    this.search.emit(this.inputValue);
    this.adjustDropdownPosition();
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.inputValue = target.value || '';
      this.onChange(this.inputValue);
      this.onSearch();
    }
  }

  showAutocomplete(): void {
    this.isAutocompleteVisible = true;
    this.adjustDropdownPosition();
  }

  hideAutocomplete(): void {
    setTimeout(() => {
      this.isAutocompleteVisible = false;
      this.onTouched(); // Mark input as touched
    }, 500);
  }

  adjustDropdownPosition(): void {
    const inputElement = this.elementRef.nativeElement.querySelector('input');
    const containerElement = this.autocompleteContainer?.nativeElement;
    if (inputElement && containerElement) {
      const inputRect = inputElement.getBoundingClientRect();
      const containerHeight = containerElement.offsetHeight;
      const spaceAbove = inputRect.top;
      const spaceBelow = window.innerHeight - inputRect.bottom;

      this.dropdownPosition =
        spaceBelow < containerHeight && spaceAbove > containerHeight
          ? 'top'
          : 'bottom';

      containerElement.classList.add(this.dropdownPosition);
      // ตั้งค่า min-width เท่ากับ input
      containerElement.style.minWidth = `${inputRect.width}px`;
      if (!this.widthAuto) {
        containerElement.style.width = `${inputRect.width}px`;
      }
    }
  }

  selectItem(item: any): void {
    if (item) {
      this.inputValue = item[this.displayKey];
      this.isAutocompleteVisible = false;
      this.onChange(this.inputValue);
      this.select.emit(item);
    }
  }
}
