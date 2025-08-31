declare module 'react-hook-form' {
  export function useForm<TFieldValues extends FieldValues = FieldValues, TContext = any>(
    props?: UseFormProps<TFieldValues, TContext>
  ): UseFormReturn<TFieldValues, TContext>;

  export interface UseFormProps<TFieldValues extends FieldValues = FieldValues, TContext = any> {
    // Add any specific props you use in your project
    defaultValues?: TFieldValues;
    mode?: 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';
  }

  export interface RegisterOptions<TFieldValues extends FieldValues = FieldValues> {
    required?: string | boolean;
    minLength?: { value: number; message: string };
    maxLength?: { value: number; message: string };
    min?: { value: number; message: string };
    max?: { value: number; message: string };
    pattern?: { value: RegExp; message: string };
  }

  export interface UseFormReturn<TFieldValues extends FieldValues = FieldValues, TContext = any> {
    register: (
      name: keyof TFieldValues, 
      options?: RegisterOptions<TFieldValues>
    ) => any;
    handleSubmit: (onSubmit: (data: TFieldValues) => void) => (event: React.FormEvent) => void;
    formState: {
      errors: Partial<Record<keyof TFieldValues, { message?: string }>>;
    };
    reset: () => void;
    watch: (name?: keyof TFieldValues) => TFieldValues[keyof TFieldValues] | TFieldValues;
    setValue: (name: keyof TFieldValues, value: TFieldValues[keyof TFieldValues]) => void;
  }

  export type FieldValues = Record<string, any>;
}
