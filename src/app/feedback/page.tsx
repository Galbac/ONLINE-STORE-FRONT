"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Headphones,
  ImageIcon,
  Loader2,
  Mail,
  MapPin,
  Phone,
  PhoneCall,
  Send,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { apiClient, API_ENDPOINTS } from "@/shared/api";
import { cn, ROUTES, STORE_INFO } from "@/shared/config";
import { formatPhoneMask } from "@/shared/lib/format/phone";
import { Button, Container } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";

const FEEDBACK_SUBJECT_OPTIONS = [
  "Качество продуктов или срок годности",
  "Вопрос по доставке или курьеру",
  "Возврат средств или чек",
  "Работа сайта / приложения",
  "Другой вопрос",
] as const;

type FeedbackSubject = (typeof FEEDBACK_SUBJECT_OPTIONS)[number];

interface UploadedPhoto {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
}

interface SubmittedTicketInfo {
  ticketNumber: string;
  subject: string;
  name: string;
  email: string;
  phone?: string | undefined;
  orderId?: string | undefined;
  photosCount: number;
}

interface FeedbackCreatePayload {
  name: string;
  email: string | null;
  phone: string | null;
  subject: string;
  message: string;
  order_id: number | null;
}

interface FeedbackResponsePayload {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string;
  message: string;
  order_id: number | null;
  status: string;
  created_date: string;
}

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState<FeedbackSubject | "">("");
  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [agreement, setAgreement] = useState(false);

  // Photos state (E-Grocery Disputes)
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation & status state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<SubmittedTicketInfo | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  // Clean up object URLs on unmount or photo removal
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, [photos]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = formatPhoneMask(e.target.value);
    setPhone(masked);
    if (formErrors.phone) {
      setFormErrors((prev) => ({ ...prev, phone: "" }));
    }
  };

  const processIncomingFiles = (fileList: FileList | File[]) => {
    setPhotoError(null);
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
    const maxFilesTotal = 3;

    const filesArray = Array.from(fileList);
    if (photos.length + filesArray.length > maxFilesTotal) {
      setPhotoError(`Максимально можно прикрепить до ${maxFilesTotal} фото. Удалите лишние, чтобы добавить новые.`);
      return;
    }

    const validNewPhotos: UploadedPhoto[] = [];

    for (const file of filesArray) {
      const isExtensionValid = /\.(jpe?g|png|webp)$/i.test(file.name);
      if (!allowedTypes.includes(file.type) && !isExtensionValid) {
        setPhotoError(`Файл «${file.name}» имеет неподдерживаемый формат. Допускаются только JPG, PNG и WebP.`);
        return;
      }

      if (file.size > maxSizeBytes) {
        setPhotoError(`Файл «${file.name}» превышает допустимый лимит 5 МБ.`);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      validNewPhotos.push({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl,
        name: file.name,
        size: file.size,
      });
    }

    setPhotos((prev) => [...prev, ...validNewPhotos]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processIncomingFiles(e.dataTransfer.files);
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) {
        URL.revokeObjectURL(found.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
    setPhotoError(null);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      errors.name = "Укажите ваше имя (не менее 2 символов)";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = "Укажите контактный email для связи и ответа";
    } else if (!emailRegex.test(email.trim())) {
      errors.email = "Введите корректный email (например, name@example.com)";
    }

    if (phone.trim()) {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 11) {
        errors.phone = "Введите полный номер телефона (+7 (999) 000-00-00)";
      }
    }

    if (!subject) {
      errors.subject = "Выберите тему обращения из выпадающего списка";
    }

    if (!message.trim() || message.trim().length < 5) {
      errors.message = "Опишите ваш вопрос или ситуацию подробнее (не менее 5 символов)";
    }

    if (!agreement) {
      errors.agreement = "Необходимо дать согласие на обработку персональных данных (152-ФЗ)";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setErrorMsg("Пожалуйста, исправьте ошибки в форме перед отправкой.");
      return;
    }

    startTransition(async () => {
      setErrorMsg("");
      try {
        let finalMessage = message.trim();
        if (photos.length > 0) {
          const photoList = photos
            .map((p, idx) => `Фото #${idx + 1}: ${p.name} (${(p.size / 1024 / 1024).toFixed(2)} МБ)`)
            .join("; ");
          finalMessage += `\n\n[Прикрепленные материалы спора (${photos.length}): ${photoList}]`;
        }

        const res = await apiClient.post<FeedbackCreatePayload, FeedbackResponsePayload>(
          API_ENDPOINTS.FEEDBACK.SUBMIT,
          {
            name: name.trim(),
            email: email.trim() || null,
            phone: phone.trim() || null,
            subject: subject,
            message: finalMessage,
            order_id: orderId ? Number(orderId) : null,
          },
        );

        const ticketNum = res?.id
          ? String(res.id).padStart(6, "0")
          : Math.floor(100000 + Math.random() * 900000).toString();

        setSubmittedTicket({
          ticketNumber: `#POB-${ticketNum}`,
          subject: subject,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          orderId: orderId.trim() || undefined,
          photosCount: photos.length,
        });

        setIsSuccess(true);
      } catch {
        setErrorMsg("Не удалось отправить сообщение. Пожалуйста, проверьте данные или свяжитесь с нами по телефону.");
      }
    });
  };

  const handleCopyTicket = () => {
    if (submittedTicket?.ticketNumber) {
      navigator.clipboard.writeText(submittedTicket.ticketNumber);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleResetForm = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPhotos([]);
    setName("");
    setEmail("");
    setPhone("");
    setSubject("");
    setOrderId("");
    setMessage("");
    setAgreement(false);
    setFormErrors({});
    setErrorMsg("");
    setPhotoError(null);
    setSubmittedTicket(null);
    setIsSuccess(false);
  };

  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-slate-50/50 py-10">
        <Container className="max-w-5xl space-y-8">
          {/* Header navigation & title */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link
              href={ROUTES.HOME}
              className="inline-flex h-10 min-h-[40px] min-w-[40px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-xs transition-all hover:border-emerald-300 hover:bg-slate-50 hover:text-emerald-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label="На главную"
            >
              <ArrowLeft size={16} className="shrink-0 text-slate-500" />
              <span>На главную</span>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Служба поддержки и заботы</h1>
              <p className="text-xs text-slate-500">Задайте вопрос, оставьте отзыв или обратитесь по качеству заказа</p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
            {/* Form Column */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
              {isSuccess && submittedTicket ? (
                /* SUCCESS CARD (SLA & Ticket #) */
                <div className="space-y-6 py-4 animate-in fade-in-0 duration-300">
                  <div className="text-center space-y-3">
                    <span className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 shadow-xs">
                      <CheckCircle2 size={38} className="animate-in zoom-in-50 duration-300" />
                    </span>
                    <h2 className="text-2xl font-black text-slate-900">Ваше обращение принято!</h2>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      Мы зафиксировали ваш запрос и передали дежурному специалисту службы клиентской поддержки.
                    </p>
                  </div>

                  {/* Ticket Badge */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4">
                    <div className="space-y-0.5 text-center sm:text-left">
                      <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                        Номер обращения
                      </span>
                      <div className="font-mono text-lg sm:text-xl font-black text-emerald-700 tracking-wider">
                        {submittedTicket.ticketNumber}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyTicket}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 text-xs font-semibold text-emerald-700 shadow-2xs transition hover:bg-emerald-50 active:scale-95 cursor-pointer"
                      title="Скопировать номер"
                    >
                      {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      <span>{isCopied ? "Скопировано!" : "Скопировать"}</span>
                    </button>
                  </div>

                  {/* SLA Response Time Box */}
                  <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/90 to-indigo-50/50 p-4 sm:p-5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                      <Clock size={16} className="text-blue-600 shrink-0" />
                      <span>SLA ответа: в течение 30–45 минут</span>
                    </div>
                    <p className="text-xs text-blue-800/90 leading-relaxed">
                      Оператор ответит вам на email <span className="font-bold">{submittedTicket.email}</span>
                      {submittedTicket.phone ? (
                        <> или свяжется по телефону <span className="font-bold">{submittedTicket.phone}</span></>
                      ) : null}{" "}
                      в регламентные сроки (служба заботы работает ежедневно с 08:00 до 22:00).
                    </p>
                  </div>

                  {/* Summary of dispute / request */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-xs space-y-2 text-slate-600">
                    <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                      <span className="text-slate-400">Тема:</span>
                      <span className="font-semibold text-slate-800 text-right">{submittedTicket.subject}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                      <span className="text-slate-400">Заявитель:</span>
                      <span className="font-semibold text-slate-800">{submittedTicket.name}</span>
                    </div>
                    {submittedTicket.orderId && (
                      <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                        <span className="text-slate-400">Номер заказа:</span>
                        <span className="font-semibold text-slate-800">№ {submittedTicket.orderId}</span>
                      </div>
                    )}
                    {submittedTicket.photosCount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Прикреплено фото:</span>
                        <span className="font-semibold text-emerald-700">{submittedTicket.photosCount} файла</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 text-center">
                    <Button onClick={handleResetForm} variant="secondary" className="h-10 text-xs font-bold">
                      Отправить еще одно обращение
                    </Button>
                  </div>
                </div>
              ) : (
                /* FORM */
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h2 className="text-lg font-bold text-slate-900">Написать в службу поддержки</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Все поля, отмеченные звездочкой (<span className="text-rose-500 font-bold">*</span>), обязательны для заполнения
                    </p>
                  </div>

                  {/* Name and Email */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="feedback-name" className="block text-xs font-semibold text-slate-700 mb-1">
                        Ваше имя <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="feedback-name"
                        className={cn(
                          "w-full rounded-xl border bg-slate-50/50 p-3 text-xs outline-none transition focus:bg-white",
                          formErrors.name
                            ? "border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-400"
                            : "border-slate-200 focus:border-emerald-500",
                        )}
                        placeholder="Иван Иванов"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: "" }));
                        }}
                        autoComplete="name"
                      />
                      {formErrors.name && (
                        <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {formErrors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="feedback-email" className="block text-xs font-semibold text-slate-700 mb-1">
                        Email для ответа <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="feedback-email"
                        type="email"
                        className={cn(
                          "w-full rounded-xl border bg-slate-50/50 p-3 text-xs outline-none transition focus:bg-white",
                          formErrors.email
                            ? "border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-400"
                            : "border-slate-200 focus:border-emerald-500",
                        )}
                        placeholder="ivan@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: "" }));
                        }}
                        autoComplete="email"
                      />
                      {formErrors.email && (
                        <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {formErrors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Phone and Order ID */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="feedback-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                        Номер телефона
                      </label>
                      <input
                        id="feedback-phone"
                        type="tel"
                        className={cn(
                          "w-full rounded-xl border bg-slate-50/50 p-3 text-xs outline-none transition focus:bg-white",
                          formErrors.phone
                            ? "border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-400"
                            : "border-slate-200 focus:border-emerald-500",
                        )}
                        placeholder="+7 (999) 000-00-00"
                        value={phone}
                        onChange={handlePhoneChange}
                        autoComplete="tel"
                      />
                      {formErrors.phone && (
                        <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {formErrors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="feedback-order-id" className="block text-xs font-semibold text-slate-700 mb-1">
                        Номер заказа (если есть)
                      </label>
                      <input
                        id="feedback-order-id"
                        type="number"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs outline-none transition focus:border-emerald-500 focus:bg-white"
                        placeholder="Например: 1045"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Subject Dropdown Select */}
                  <div>
                    <label htmlFor="feedback-subject" className="block text-xs font-semibold text-slate-700 mb-1">
                      Тема обращения <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="feedback-subject"
                      value={subject}
                      onChange={(e) => {
                        setSubject(e.target.value as FeedbackSubject);
                        if (formErrors.subject) setFormErrors((prev) => ({ ...prev, subject: "" }));
                      }}
                      className={cn(
                        "w-full rounded-xl border bg-slate-50/50 p-3 text-xs outline-none transition focus:bg-white cursor-pointer",
                        formErrors.subject
                          ? "border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-400"
                          : "border-slate-200 focus:border-emerald-500",
                        !subject && "text-slate-400",
                      )}
                    >
                      <option value="" disabled>
                        -- Выберите тему обращения --
                      </option>
                      {FEEDBACK_SUBJECT_OPTIONS.map((option) => (
                        <option key={option} value={option} className="text-slate-800">
                          {option}
                        </option>
                      ))}
                    </select>
                    {formErrors.subject && (
                      <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {formErrors.subject}
                      </p>
                    )}
                  </div>

                  {/* Message textarea */}
                  <div>
                    <label htmlFor="feedback-message" className="block text-xs font-semibold text-slate-700 mb-1">
                      Сообщение <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="feedback-message"
                      rows={4}
                      className={cn(
                        "w-full rounded-xl border bg-slate-50/50 p-3 text-xs outline-none transition focus:bg-white",
                        formErrors.message
                          ? "border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-400"
                          : "border-slate-200 focus:border-emerald-500",
                      )}
                      placeholder="Опишите подробно ваш вопрос, проблему с товаром или предложение..."
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        if (formErrors.message) setFormErrors((prev) => ({ ...prev, message: "" }));
                      }}
                    />
                    {formErrors.message && (
                      <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {formErrors.message}
                      </p>
                    )}
                  </div>

                  {/* DRAG-AND-DROP PHOTO UPLOAD (E-GROCERY DISPUTES) */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <ImageIcon size={15} className="text-emerald-600" />
                        Фотографии бракованных продуктов / чека
                      </label>
                      <span className="text-[11px] font-medium text-slate-400">
                        {photos.length} / 3 файлов
                      </span>
                    </div>

                    {/* Dropzone */}
                    {photos.length < 3 && (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer",
                          isDragging
                            ? "border-emerald-500 bg-emerald-50/60 scale-[1.01]"
                            : "border-slate-200 bg-slate-50/40 hover:border-emerald-400 hover:bg-emerald-50/20",
                        )}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              processIncomingFiles(e.target.files);
                              e.target.value = "";
                            }
                          }}
                        />
                        <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-2xs border border-slate-200/80 group-hover:text-emerald-600 group-hover:border-emerald-200 transition">
                          <UploadCloud size={22} />
                        </div>
                        <p className="mt-2.5 text-xs font-semibold text-slate-700">
                          <span className="text-emerald-700 hover:underline">Выберите файлы</span> или перетащите их сюда
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          JPG, PNG или WebP до 5 МБ (до 3 файлов)
                        </p>
                      </div>
                    )}

                    {photoError && (
                      <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {photoError}
                      </p>
                    )}

                    {/* Previews Grid */}
                    {photos.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        {photos.map((item, index) => (
                          <div
                            key={item.id}
                            className="group relative flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-2xs transition hover:border-emerald-200"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.previewUrl}
                              alt={item.name}
                              className="size-14 rounded-xl object-cover border border-slate-100 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-800 truncate" title={item.name}>
                                {item.name}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {(item.size / (1024 * 1024)).toFixed(2)} МБ • #{index + 1}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(item.id)}
                              className="flex size-7 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition active:scale-90 cursor-pointer shrink-0"
                              title="Удалить фото"
                              aria-label={`Удалить фото ${item.name}`}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 152-FZ Agreement Checkbox */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="feedback-agreement"
                        checked={agreement}
                        onChange={(e) => {
                          setAgreement(e.target.checked);
                          if (formErrors.agreement) setFormErrors((prev) => ({ ...prev, agreement: "" }));
                        }}
                        className="mt-0.5 size-4 rounded border-slate-300 text-emerald-600 accent-emerald-600 cursor-pointer"
                      />
                      <label
                        htmlFor="feedback-agreement"
                        className="text-xs text-slate-500 leading-normal cursor-pointer select-none"
                      >
                        <span className="text-rose-500 font-bold">* </span>
                        Я согласен на обработку персональных данных в соответствии с{" "}
                        <Link
                          href={ROUTES.PRIVACY}
                          className="text-emerald-600 font-semibold underline hover:text-emerald-700"
                        >
                          Политикой конфиденциальности (152-ФЗ)
                        </Link>
                      </label>
                    </div>
                    {formErrors.agreement && (
                      <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1 pl-6">
                        <AlertCircle size={12} />
                        {formErrors.agreement}
                      </p>
                    )}
                  </div>

                  {errorMsg && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-semibold text-rose-600 flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Submit Button with Loading Spinner */}
                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="h-11 px-6 text-xs font-bold gap-2 min-w-[190px]"
                    >
                      {isPending ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-white" />
                          <span>Отправка обращения...</span>
                        </>
                      ) : (
                        <>
                          <Send size={15} />
                          <span>Отправить обращение</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Sidebar info (Right Column) */}
            <div className="space-y-6">
              {/* Direct Contacts with fixed typo */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Headphones size={18} className="text-emerald-600" />
                  Прямые контакты
                </h3>
                <div className="space-y-3.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <Phone size={15} className="text-slate-400 shrink-0" />
                    <a
                      href={STORE_INFO.phoneHref}
                      className="font-bold text-slate-800 hover:text-emerald-700 transition"
                    >
                      {STORE_INFO.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail size={15} className="text-slate-400 shrink-0" />
                    <a
                      href={`mailto:${STORE_INFO.email}`}
                      className="font-bold text-slate-800 hover:text-emerald-700 transition"
                    >
                      {STORE_INFO.email}
                    </a>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MapPin size={15} className="text-slate-400 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">Кизляр, работаем без выходных с 08:00 до 22:00</span>
                  </div>
                </div>
              </div>

              {/* Emergency Dispatcher Banner (Column Height Balancer) */}
              <div className="rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white p-6 shadow-sm space-y-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-xs shrink-0">
                    <PhoneCall size={18} />
                  </span>
                  <div>
                    <h4 className="text-xs font-black tracking-tight text-amber-950 uppercase">
                      Экстренная связь
                    </h4>
                    <p className="text-[11px] font-bold text-amber-800">
                      Проблема с текущим заказом?
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Если курьер опаздывает или необходимо экстренно откорректировать состав уже выехавшего заказа:
                </p>

                <a
                  href="tel:+79285191485"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-amber-700 active:scale-95"
                >
                  <Phone size={14} />
                  <span>Позвонить диспетчеру: +7 (928) 519-14-85</span>
                </a>

                <p className="text-[10px] text-slate-400 text-center">
                  Диспетчер отвечает в течение 30 секунд (08:00–22:00)
                </p>
              </div>

              {/* Quality Guarantee Box */}
              <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 border border-emerald-100/80 space-y-2">
                <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
                  Гарантия качества и свежести
                </h4>
                <p className="text-[11px] leading-relaxed text-emerald-800">
                  Если вам привезли товар ненадлежащего качества, мы заменим его или вернем деньги в пределах срока годности товара (до 48 часов для охлажденной продукции).
                </p>
              </div>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
