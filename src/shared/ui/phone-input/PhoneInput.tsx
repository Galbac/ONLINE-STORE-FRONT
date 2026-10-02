"use client";

import React, { forwardRef, useEffect, useState } from "react";
import { formatPhoneMask, handlePhoneInputChange } from "@/shared/lib/format/phone";
import { cn } from "@/shared/config";

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "defaultValue"> {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onRawChange?: (rawDigits: string) => void;
  label?: string;
  error?: string;
  containerClassName?: string;
  icon?: React.ReactNode;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      onRawChange,
      label,
      error,
      className,
      containerClassName,
      icon,
      placeholder = "+7 (___) ___-__-__",
      required,
      disabled,
      name = "phone",
      id,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const isControlled = value !== undefined;
    const [innerValue, setInnerValue] = useState(() =>
      defaultValue ? formatPhoneMask(defaultValue) : ""
    );

    const displayValue = isControlled ? formatPhoneMask(value) : innerValue;

    useEffect(() => {
      if (defaultValue !== undefined && !isControlled) {
        setInnerValue(formatPhoneMask(defaultValue));
      }
    }, [defaultValue, isControlled]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = handlePhoneInputChange(e.target.value, displayValue);
      if (!isControlled) {
        setInnerValue(nextValue);
      }
      onChange?.(nextValue);
      if (onRawChange) {
        onRawChange(nextValue.replace(/\D/g, ""));
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (!displayValue) {
        const initial = "+7 (";
        if (!isControlled) {
          setInnerValue(initial);
        }
        onChange?.(initial);
      }
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (displayValue === "+7 (" || displayValue === "+7") {
        if (!isControlled) {
          setInnerValue("");
        }
        onChange?.("");
      }
      onBlur?.(e);
    };

    const inputElement = (
      <input
        ref={ref}
        id={id}
        name={name}
        type="tel"
        autoComplete="tel"
        maxLength={18}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          "border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm transition outline-none",
          icon ? "pl-10" : "",
          error ? "border-rose-400 focus:border-rose-500 ring-rose-500/20" : "",
          className
        )}
        {...props}
      />
    );

    if (!label && !error && !icon && !containerClassName) {
      return inputElement;
    }

    return (
      <div className={cn("block w-full", containerClassName)}>
        {label && (
          <label htmlFor={id} className="block text-xs font-bold text-slate-700 mb-1.5">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
              {icon}
            </div>
          )}
          {inputElement}
        </div>
        {error && (
          <p className="mt-1 text-xs font-semibold text-rose-500 animate-in fade-in-0">
            {error}
          </p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
