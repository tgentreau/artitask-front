import { Component, Input, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DEFAULT_MAJORATIONS, DEFAULT_TARIFS } from '../../models/service.constants';

interface TarificationValue {
  tarifHoraire?: number;
  tarifFixe?: number;
  majorationUrgence: number;
  majorationWeekend: number;
  fraisDeplacement?: number;
}

@Component({
  selector: 'app-tarification-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tarification-form.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TarificationFormComponent),
      multi: true
    }
  ]
})
export class TarificationFormComponent implements ControlValueAccessor {
  @Input() serviceType?: string;

  tarificationForm: FormGroup;
  tarifMode = signal<'hourly' | 'fixed'>('hourly');
  showAdvanced = signal(false);

  defaultMajorations = DEFAULT_MAJORATIONS;

  private onChange: (value: TarificationValue) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private fb: FormBuilder) {
    this.tarificationForm = this.fb.group({
      tarifHoraire: [null, [Validators.min(0), Validators.max(1000)]],
      tarifFixe: [null, [Validators.min(0), Validators.max(10000)]],
      majorationUrgence: [DEFAULT_MAJORATIONS.urgence, [
        Validators.required,
        Validators.min(1),
        Validators.max(3)
      ]],
      majorationWeekend: [DEFAULT_MAJORATIONS.weekend, [
        Validators.required,
        Validators.min(1),
        Validators.max(3)
      ]],
      fraisDeplacement: [null, [Validators.min(0), Validators.max(500)]]
    });

    this.tarificationForm.valueChanges.subscribe(value => {
      this.onChange(this.getValue());
    });
  }

  writeValue(value: TarificationValue): void {
    if (value) {
      if (value.tarifHoraire) {
        this.tarifMode.set('hourly');
      } else if (value.tarifFixe) {
        this.tarifMode.set('fixed');
      }
      this.tarificationForm.patchValue(value, { emitEvent: false });
    }
  }

  registerOnChange(fn: (value: TarificationValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.tarificationForm.disable();
    } else {
      this.tarificationForm.enable();
    }
  }

  toggleTarifMode(mode: 'hourly' | 'fixed'): void {
    this.tarifMode.set(mode);

    if (mode === 'hourly') {
      const currentHoraire = this.tarificationForm.get('tarifHoraire')?.value;
      const defaultHoraire = this.getDefaultTarifHoraire();

      this.tarificationForm.patchValue({
        tarifFixe: null,
        tarifHoraire: currentHoraire || defaultHoraire
      });
    } else {
      const currentFixe = this.tarificationForm.get('tarifFixe')?.value;
      const defaultFixe = this.getDefaultTarifFixe();

      this.tarificationForm.patchValue({
        tarifHoraire: null,
        tarifFixe: currentFixe || defaultFixe
      });
    }
  }

  toggleAdvanced(): void {
    this.showAdvanced.update(v => !v);
  }

  formatMajorationDisplay(value: number): string {
    const percentage = Math.round((value - 1) * 100);
    return percentage > 0 ? `+${percentage}%` : `${percentage}%`;
  }

  private getValue(): TarificationValue {
    const formValue = this.tarificationForm.value;
    const value: TarificationValue = {
      majorationUrgence: formValue.majorationUrgence,
      majorationWeekend: formValue.majorationWeekend
    };

    if (this.tarifMode() === 'hourly' && formValue.tarifHoraire) {
      value.tarifHoraire = formValue.tarifHoraire;
    } else if (formValue.tarifFixe) {
      value.tarifFixe = formValue.tarifFixe;
    }

    if (formValue.fraisDeplacement) {
      value.fraisDeplacement = formValue.fraisDeplacement;
    }

    return value;
  }

  private getDefaultTarifHoraire(type?: string): number {
    if (!type) return 45;
    const defaults = DEFAULT_TARIFS[type];
    return defaults?.horaire || 45;
  }

  private getDefaultTarifFixe(type?: string): number {
    if (!type) return 150;
    const defaults = DEFAULT_TARIFS[type];
    return defaults?.fixe || 150;
  }
}
