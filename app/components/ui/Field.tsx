import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const baseControl =
  "w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

interface FieldProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export function TextInput({ className = "", ...rest }: TextInputProps) {
  return <input className={`${baseControl} ${className}`} {...rest} />;
}

type SelectInputProps = SelectHTMLAttributes<HTMLSelectElement>;

export function SelectInput({
  className = "",
  children,
  ...rest
}: SelectInputProps) {
  return (
    <select className={`${baseControl} ${className}`} {...rest}>
      {children}
    </select>
  );
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextArea({ className = "", ...rest }: TextAreaProps) {
  return (
    <textarea className={`${baseControl} resize-none ${className}`} {...rest} />
  );
}
