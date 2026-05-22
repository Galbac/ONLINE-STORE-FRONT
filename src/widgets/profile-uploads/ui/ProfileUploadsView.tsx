"use client";

import { type ChangeEvent, type FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { FileImage, Info, Search, Trash2, Upload } from "lucide-react";
import { uploadApi, type UploadEntityType, type UploadFileResponse } from "@/entities/upload";
import { ROUTES } from "@/shared/config";
import { Button, Container, getStoredAccessToken } from "@/shared/ui";

const entityTypeOptions: Array<{ label: string; value: UploadEntityType }> = [
  { label: "Другое", value: "other" },
  { label: "Товар", value: "product" },
  { label: "Категория", value: "category" },
  { label: "Баннер", value: "banner" },
  { label: "Пункт самовывоза", value: "pickup_point" },
];

export const ProfileUploadsView = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [entityType, setEntityType] = useState<UploadEntityType>("other");
  const [fileId, setFileId] = useState("");
  const [currentFile, setCurrentFile] = useState<UploadFileResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"upload" | "lookup" | "delete" | null>(null);
  const [isPending, startTransition] = useTransition();
  const isBusy = isPending || pendingAction !== null;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setSelectedFile(event.target.files?.[0] ?? null);
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const handleUpload = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (!selectedFile) {
      setErrorMessage("Выберите изображение для загрузки.");
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setErrorMessage("Можно загрузить только изображение.");
      return;
    }

    const accessToken = getStoredAccessToken();

    startTransition(async () => {
      try {
        setPendingAction("upload");
        setErrorMessage(null);
        const response = await uploadApi.uploadImage(
          {
            file: selectedFile,
            entity_type: entityType,
          },
          accessToken,
        );

        setCurrentFile(response);
        setFileId(String(response.id));
        setStatusMessage("Изображение загружено.");
      } catch {
        setStatusMessage(null);
        setErrorMessage("Не удалось загрузить изображение.");
      } finally {
        setPendingAction(null);
      }
    });
  };

  const handleLookup = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const parsedFileId = toPositiveInteger(fileId);

    if (parsedFileId === null) {
      setErrorMessage("Введите корректный ID файла.");
      return;
    }

    const accessToken = getStoredAccessToken();

    startTransition(async () => {
      try {
        setPendingAction("lookup");
        setErrorMessage(null);
        const response = await uploadApi.getById(parsedFileId, accessToken);

        setCurrentFile(response);
        setStatusMessage("Информация о файле обновлена.");
      } catch {
        setStatusMessage(null);
        setErrorMessage("Не удалось получить информацию о файле.");
      } finally {
        setPendingAction(null);
      }
    });
  };

  const handleDelete = (): void => {
    if (!currentFile) {
      return;
    }

    const accessToken = getStoredAccessToken();

    startTransition(async () => {
      try {
        setPendingAction("delete");
        setErrorMessage(null);
        const response = await uploadApi.deleteById(currentFile.id, accessToken);

        setCurrentFile(null);
        setSelectedFile(null);
        setStatusMessage(response.message || "Файл удалён.");
      } catch {
        setStatusMessage(null);
        setErrorMessage("Не удалось удалить файл.");
      } finally {
        setPendingAction(null);
      }
    });
  };

  return (
    <main className="bg-bg-primary min-h-[70vh]">
      <Container className="py-6 md:py-8">
        <nav className="text-text-secondary mb-8 flex flex-wrap items-center gap-2 text-sm">
          <Link className="hover:text-accent-primary" href={ROUTES.HOME}>
            Главная
          </Link>
          <span>/</span>
          <Link className="hover:text-accent-primary" href={ROUTES.PROFILE}>
            Профиль
          </Link>
          <span>/</span>
          <span>Файлы</span>
        </nav>

        <header className="mb-8">
          <h1 className="text-text-primary text-4xl font-bold md:text-5xl">Загрузка файлов</h1>
          <p className="text-text-secondary mt-4 max-w-2xl leading-7">
            Загрузите изображение и проверьте информацию по ID файла.
          </p>
        </header>

        {statusMessage ? (
          <p className="text-success mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm">
            {statusMessage}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="text-error mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm">{errorMessage}</p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.65fr)]">
          <section className="border-border rounded-lg border bg-white p-5 shadow-[0_14px_40px_rgb(20_28_18/0.06)] md:p-7">
            <h2 className="text-text-primary flex items-center gap-3 text-2xl font-bold">
              <Upload className="text-accent-primary" size={28} />
              Загрузить изображение
            </h2>

            <form className="mt-6 space-y-5" onSubmit={handleUpload}>
              <label className="border-border hover:border-accent-primary block cursor-pointer rounded-lg border border-dashed p-6 transition">
                <span className="text-text-primary flex items-center gap-3 font-bold">
                  <FileImage className="text-accent-primary" size={28} />
                  {selectedFile?.name ?? "Выберите файл"}
                </span>
                <span className="text-text-secondary mt-2 block text-sm">
                  Поддерживаются изображения, которые принимает backend.
                </span>
                <input
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>

              <label className="block">
                <span className="mb-3 block text-sm font-bold">Назначение</span>
                <select
                  className="border-border h-12 w-full rounded-lg border bg-white px-4 text-sm outline-none"
                  value={entityType}
                  onChange={(event) => setEntityType(event.target.value as UploadEntityType)}
                >
                  {entityTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <Button className="h-12 w-full gap-2" type="submit" disabled={isBusy}>
                <Upload size={18} />
                Загрузить
              </Button>
            </form>
          </section>

          <section className="border-border rounded-lg border bg-white p-5 shadow-[0_14px_40px_rgb(20_28_18/0.06)] md:p-7">
            <h2 className="text-text-primary flex items-center gap-3 text-2xl font-bold">
              <Search className="text-accent-primary" size={28} />
              Найти файл
            </h2>
            <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={handleLookup}>
              <input
                className="border-border h-12 min-w-0 flex-1 rounded-lg border px-4 text-sm outline-none"
                inputMode="numeric"
                placeholder="ID файла"
                value={fileId}
                onChange={(event) => setFileId(event.target.value)}
              />
              <Button className="h-12 gap-2" type="submit" disabled={isBusy}>
                <Search size={18} />
                Найти
              </Button>
            </form>
          </section>
        </div>

        <section className="border-border mt-6 rounded-lg border bg-white p-5 shadow-[0_14px_40px_rgb(20_28_18/0.06)] md:p-7">
          <h2 className="text-text-primary flex items-center gap-3 text-2xl font-bold">
            <Info className="text-accent-primary" size={28} />
            Информация о файле
          </h2>

          {currentFile ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div className="border-border bg-bg-primary overflow-hidden rounded-lg border">
                <img
                  className="aspect-square w-full object-cover"
                  src={currentFile.url}
                  alt={currentFile.original_filename}
                />
              </div>
              <div>
                <dl className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
                  <FileInfo label="ID" value={String(currentFile.id)} />
                  <FileInfo label="Файл" value={currentFile.original_filename} />
                  <FileInfo label="MIME" value={currentFile.mime_type} />
                  <FileInfo label="Размер" value={formatFileSize(currentFile.size)} />
                  <FileInfo label="Хранилище" value={currentFile.storage_type} />
                  <FileInfo label="Назначение" value={currentFile.entity_type ?? "Не указано"} />
                  <FileInfo label="Дата" value={formatDateTime(currentFile.created_at)} />
                  <FileInfo label="URL" value={currentFile.url} />
                </dl>
                <Button
                  className="mt-6 h-12 gap-2 bg-red-600 text-white hover:bg-red-700"
                  type="button"
                  disabled={isBusy}
                  onClick={handleDelete}
                >
                  <Trash2 size={18} />
                  Удалить файл
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-text-secondary bg-bg-hover mt-6 rounded-lg p-6 text-sm">
              Загрузите изображение или найдите файл по ID.
            </div>
          )}
        </section>
      </Container>
    </main>
  );
};

interface FileInfoProps {
  label: string;
  value: string;
}

const FileInfo = ({ label, value }: FileInfoProps) => {
  return (
    <>
      <dt className="text-text-secondary">{label}</dt>
      <dd className="text-text-primary min-w-0 font-bold break-words">{value}</dd>
    </>
  );
};

const toPositiveInteger = (value: string): number | null => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
};

const formatFileSize = (size: number): string => {
  if (size < 1024) {
    return `${size} Б`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} КБ`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} МБ`;
};

const formatDateTime = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};
