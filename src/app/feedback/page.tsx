"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Headphones, Mail, MapPin, Phone, Send } from "lucide-react";
import { apiClient, API_ENDPOINTS } from "@/shared/api";
import { ROUTES, STORE_INFO } from "@/shared/config";
import { Button, Container } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState("");

  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim() || !message.trim()) {
      setErrorMsg("Заполните обязательные поля: Имя, Тема и Сообщение.");
      return;
    }

    startTransition(async () => {
      setErrorMsg("");
      try {
        await apiClient.post(API_ENDPOINTS.FEEDBACK.SUBMIT, {
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          subject: subject.trim(),
          message: message.trim(),
          order_id: orderId ? Number(orderId) : null,
        });
        setIsSuccess(true);
      } catch {
        setErrorMsg("Не удалось отправить сообщение. Пожалуйста, проверьте данные или свяжитесь по телефону.");
      }
    });
  };

  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-slate-50/50 py-10">
        <Container className="max-w-5xl space-y-8">
          <div className="flex items-center gap-4">
            <Link
              href={ROUTES.HOME}
              className="flex size-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 shadow-xs"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Служба поддержки и заботы</h1>
              <p className="text-xs text-slate-500">Задайте вопрос, оставьте отзыв или обратитесь по качеству заказа</p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Form */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
              {isSuccess ? (
                <div className="py-12 text-center space-y-4 animate-in fade-in-0 duration-200">
                  <span className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={36} />
                  </span>
                  <h2 className="text-2xl font-black text-slate-900">Ваше сообщение отправлено!</h2>
                  <p className="text-xs max-w-md mx-auto text-slate-500 leading-relaxed">
                    Мы получили ваше обращение и ответим вам на указанный email или свяжемся по телефону в ближайшее время.
                  </p>
                  <Button onClick={() => { setIsSuccess(false); setMessage(""); setSubject(""); }} variant="secondary">
                    Отправить еще одно сообщение
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="text-lg font-bold text-slate-900">Написать нам</h2>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Ваше имя <span className="text-rose-500">*</span>
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs outline-none focus:border-emerald-500 focus:bg-white"
                        placeholder="Иван Иванов"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email для ответа
                      </label>
                      <input
                        type="email"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs outline-none focus:border-emerald-500 focus:bg-white"
                        placeholder="ivan@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Номер телефона
                      </label>
                      <input
                        type="tel"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs outline-none focus:border-emerald-500 focus:bg-white"
                        placeholder="+7 (999) 000-00-00"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Номер заказа (если есть)
                      </label>
                      <input
                        type="number"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs outline-none focus:border-emerald-500 focus:bg-white"
                        placeholder="Например: 1045"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Тема обращения <span className="text-rose-500">*</span>
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs outline-none focus:border-emerald-500 focus:bg-white"
                      placeholder="Вопрос по доставке / качество продуктов / другое"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Сообщение <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs outline-none focus:border-emerald-500 focus:bg-white"
                      placeholder="Опишите подробно ваш вопрос или предложение..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                    />
                  </div>

                  {errorMsg ? <p className="text-xs font-semibold text-rose-500">{errorMsg}</p> : null}

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isPending} className="gap-2">
                      <Send size={15} />
                      {isPending ? "Отправляем..." : "Отправить обращение"}
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Sidebar info */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Headphones size={18} className="text-emerald-600" />
                  Прямые контакты
                </h3>
                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <Phone size={15} className="text-slate-400" />
                    <a href={STORE_INFO.phoneHref} className="font-bold text-slate-800 hover:text-emerald-700">
                      {STORE_INFO.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail size={15} className="text-slate-400" />
                    <a href={`mailto:${STORE_INFO.email}`} className="font-bold text-slate-800 hover:text-emerald-700">
                      {STORE_INFO.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin size={15} className="text-slate-400" />
                    <span>{STORE_INFO.city}, работаем без выходных с 08:00 до 22:00</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 border border-emerald-100/80 space-y-2">
                <h4 className="text-xs font-bold text-emerald-900">Гарантия качества</h4>
                <p className="text-[11px] leading-relaxed text-emerald-800">
                  Если вам привезли товар ненадлежащего качества, мы заменим его или вернем деньги в течение 24 часов.
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
