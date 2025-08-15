import { FormGroup, FormControl, ValidationErrors } from '@angular/forms';
import {ApiErrorResponse} from "../models/api-error-response.interface";


export class FormErrorHandler {

  static applyBackendErrors(form: FormGroup, errorResponse: ApiErrorResponse): void {
    if (!errorResponse.errors || !Array.isArray(errorResponse.errors)) {
      return;
    }

    errorResponse.errors.forEach(error => {
      const control = form.get(error.field);
      if (control) {
        const existingErrors = control.errors || {};
        const newErrors: ValidationErrors = {
          ...existingErrors,
          backend: error.messages
        };
        control.setErrors(newErrors);
        control.markAsTouched();
      }
    });
  }

  static clearBackendErrors(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control && control.errors?.['backend']) {
        const newErrors = { ...control.errors };
        delete newErrors['backend'];

        if (Object.keys(newErrors).length === 0) {
          control.setErrors(null);
        } else {
          control.setErrors(newErrors);
        }
      }
    });
  }

  static getFieldError(form: FormGroup, fieldName: string): string | null {
    const control = form.get(fieldName);

    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.errors['backend']) {
      const backendErrors = control.errors['backend'];
      if (Array.isArray(backendErrors) && backendErrors.length > 0) {
        return backendErrors[0];
      }
      if (typeof backendErrors === 'string') {
        return backendErrors;
      }
    }

    if (control.errors['required']) {
      return 'Ce champ est requis';
    }

    if (control.errors['email']) {
      return 'Email invalide';
    }

    if (control.errors['minlength']) {
      const minLength = control.errors['minlength'].requiredLength;
      return `Minimum ${minLength} caractères requis`;
    }

    if (control.errors['maxlength']) {
      const maxLength = control.errors['maxlength'].requiredLength;
      return `Maximum ${maxLength} caractères autorisés`;
    }

    if (control.errors['pattern']) {
      return 'Format invalide';
    }

    if (control.errors['min']) {
      return `La valeur minimum est ${control.errors['min'].min}`;
    }

    if (control.errors['max']) {
      return `La valeur maximum est ${control.errors['max'].max}`;
    }

    if (control.errors['passwordMismatch']) {
      return 'Les mots de passe ne correspondent pas';
    }

    if (control.errors['weakPassword']) {
      return 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial';
    }

    return 'Valeur invalide';
  }

  static hasFieldError(form: FormGroup, fieldName: string): boolean {
    const control = form.get(fieldName);
    return !!(control?.touched && control?.errors);
  }

  static markAllAsTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markAllAsTouched(control);
      }
    });
  }

  static getFirstError(form: FormGroup): string | null {
    for (const key of Object.keys(form.controls)) {
      const control = form.get(key);
      if (control?.errors) {
        const error = this.getFieldError(form, key);
        if (error) {
          return `${key}: ${error}`;
        }
      }
    }
    return null;
  }

  static getAllErrors(form: FormGroup): Record<string, string> {
    const errors: Record<string, string> = {};

    Object.keys(form.controls).forEach(key => {
      const error = this.getFieldError(form, key);
      if (error) {
        errors[key] = error;
      }
    });

    return errors;
  }
}
