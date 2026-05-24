"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Image from "next/image";
import { FileImage, Info, Search, Trash2, Upload } from "lucide-react";
import {
  adminUploadApi,
  type AdminUploadEntityType,
  type AdminUploadFileResponse,
} from "@/entities/admin-upload";
import { getStoredAdminAccessToken } from "@/shared/api";

const entityTypeOptions: Array<{ label: string; value: AdminUploadEntityType }> = [
  { label: "Товар", value: "product" },
  { label: "Категория", value: "category" },
  { label: "Баннер", value: "banner" },
  { label: "Пункт самовывоза", value: "pickup_point" },
  { label: "Другое", value: "other" },
];

export const AdminUploadsView = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [entityType, setEntityType] = useState<AdminUploadEntityType>("product");
  const [fileId, setFileId] = useState("");
  const [currentFile, setCurrentFile] = useState<AdminUploadFileResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"delete" | "lookup" | "upload" | null>(null);
  const [isPending, startTransition] = useTransition();
  const isBusy = isPending || pendingAction !== null;
  const previewUrl = useObjectUrl(selectedFile);
  const visiblePreviewUrl = previewUrl ?? currentFile?.url ?? null;

  const selectedFileMeta = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    return `${selectedFile.type || "unknown"} · ${formatFileSize(selectedFile.size)}`;
  }, [selectedFile]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setStatusMessage(null);
    setErrorMessage(null);

    if (file && !file.type.startsWith("image/")) {
      setErrorMessage("Можно загрузить только изображение.");
    }
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

    startTransition(async () => {
      try {
        setPendingAction("upload");
        setErrorMessage(null);
        const response = await adminUploadApi.uploadImage(
          {
            entity_type: entityType,
            file: selectedFile,
          },
          getStoredAdminAccessToken(),
        );

        setCurrentFile(response);
        setFileId(String(response.id));
        setStatusMessage("Изображение загружено.");
      } catch {
        setStatusMessage(null);
        setErrorMessage("Не удалось загрузить изображение. Проверьте файл или войдите заново.");
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

    startTransition(async () => {
      try {
        setPendingAction("lookup");
        setErrorMessage(null);
        const response = await adminUploadApi.getById(parsedFileId, getStoredAdminAccessToken());

        setCurrentFile(response);
        setSelectedFile(null);
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

    startTransition(async () => {
      try {
        setPendingAction("delete");
        setErrorMessage(null);
        const response = await adminUploadApi.deleteById(
          currentFile.id,
          getStoredAdminAccessToken(),
        );

        setCurrentFile(null);
        setSelectedFile(null);
        setStatusMessage(response.message || "Файл удалён.");
      } catch {
        setStatusMessage(null);
        setErrorMessage("Не удалось удалить файл. Проверьте права или войдите заново.");
      } finally {
        setPendingAction(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-text-primary text-2xl font-bold sm:text-3xl">Загрузка файлов</h1>
        <p className="text-text-secondary mt-2">
          Админская загрузка изображений, проверка файла по ID и удаление из хранилища.
        </p>
      </section>

      {statusMessage ? <Alert tone="success">{statusMessage}</Alert> : null}
      {errorMessage ? <Alert tone="error">{errorMessage}</Alert> : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.65fr)]">
        <form
          className="border-border bg-bg-primary shadow-soft rounded-lg border p-5"
          onSubmit={handleUpload}
        >
          <SectionTitle icon={<Upload size={18} />} title="Загрузить изображение" />

          <div className="mt-5 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <PreviewPanel
              alt={selectedFile?.name ?? currentFile?.original_filename ?? "Preview"}
              previewUrl={visiblePreviewUrl}
            />

            <div className="space-y-4">
              <label className="border-border hover:border-accent-primary block cursor-pointer rounded-lg border border-dashed p-5 transition">
                <span className="text-text-primary flex items-center gap-3 font-bold">
                  <FileImage className="text-accent-primary" size={24} />
                  {selectedFile?.name ?? "Выберите файл"}
                </span>
                {selectedFileMeta ? (
                  <span className="text-text-secondary mt-2 block text-sm">{selectedFileMeta}</span>
                ) : null}
                <input
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileChange}
                  type="file"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">Назначение</span>
                <select
                  className="border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
                  onChange={(event) => setEntityType(event.target.value as AdminUploadEntityType)}
                  value={entityType}
                >
                  {entityTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                className="bg-accent-primary text-accent-contrast hover:bg-accent-hover inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-bold transition disabled:opacity-60"
                disabled={isBusy}
                type="submit"
              >
                <Upload size={16} />
                Загрузить
              </button>
            </div>
          </div>
        </form>

        <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
          <SectionTitle icon={<Search size={18} />} title="Найти файл" />
          <form
            className="mt-5 flex flex-col gap-3 sm:flex-row xl:flex-col"
            onSubmit={handleLookup}
          >
            <input
              className="border-border focus:border-accent-primary bg-bg-primary h-11 min-w-0 flex-1 rounded-lg border px-3 text-sm transition outline-none"
              inputMode="numeric"
              onChange={(event) => setFileId(event.target.value)}
              placeholder="ID файла"
              value={fileId}
            />
            <button
              className="border-border hover:bg-bg-hover inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-bold transition disabled:opacity-60"
              disabled={isBusy}
              type="submit"
            >
              <Search size={16} />
              Найти
            </button>
          </form>
        </section>
      </section>

      <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
        <SectionTitle icon={<Info size={18} />} title="Информация о файле" />

        {currentFile ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <PreviewPanel alt={currentFile.original_filename} previewUrl={currentFile.url} />
            <div className="min-w-0">
              <dl className="grid gap-4 sm:grid-cols-[170px_minmax(0,1fr)]">
                <FileInfo label="ID" value={String(currentFile.id)} />
                <FileInfo label="Файл" value={currentFile.original_filename} />
                <FileInfo label="MIME" value={currentFile.mime_type} />
                <FileInfo label="Размер" value={formatFileSize(currentFile.size)} />
                <FileInfo label="Хранилище" value={currentFile.storage_type} />
                <FileInfo label="Назначение" value={getEntityTypeLabel(currentFile.entity_type)} />
                <FileInfo label="Дата" value={formatDateTime(currentFile.created_at)} />
                <FileInfo label="URL" value={currentFile.url} />
              </dl>
              <button
                className="text-error border-border hover:bg-bg-hover mt-5 inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-bold transition disabled:opacity-60"
                disabled={isBusy}
                onClick={handleDelete}
                type="button"
              >
                <Trash2 size={16} />
                Удалить файл
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-bg-secondary text-text-secondary mt-5 rounded-lg p-5 text-sm">
            Загрузите изображение или найдите файл по ID.
          </div>
        )}
      </section>
    </div>
  );
};

const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div className="flex items-center gap-3">
    <span className="bg-bg-secondary text-accent-primary grid size-10 place-items-center rounded-lg">
      {icon}
    </span>
    <h2 className="text-text-primary text-lg font-bold">{title}</h2>
  </div>
);

const PreviewPanel = ({ alt, previewUrl }: { alt: string; previewUrl: string | null }) => (
  <div className="border-border bg-bg-secondary relative grid aspect-square w-full place-items-center overflow-hidden rounded-lg border">
    {previewUrl ? (
      <Image alt={alt} className="object-cover" fill sizes="260px" src={previewUrl} unoptimized />
    ) : (
      <FileImage className="text-text-muted" size={42} />
    )}
  </div>
);

const FileInfo = ({ label, value }: { label: string; value: string }) => (
  <>
    <dt className="text-text-secondary text-sm">{label}</dt>
    <dd className="text-text-primary min-w-0 text-sm font-bold break-words">{value}</dd>
  </>
);

const Alert = ({ children, tone }: { children: React.ReactNode; tone: "error" | "success" }) => (
  <div
    className={
      tone === "success"
        ? "border-border bg-bg-primary text-success rounded-lg border p-4 text-sm font-bold"
        : "border-border bg-bg-primary text-error rounded-lg border p-4 text-sm font-bold"
    }
  >
    {children}
  </div>
);

const useObjectUrl = (file: File | null): string | null => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return undefined;
    }

    const url = URL.createObjectURL(file);
    setObjectUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  return objectUrl;
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
    timeZone: "Europe/Moscow",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getEntityTypeLabel = (value?: string | null): string => {
  return entityTypeOptions.find((option) => option.value === value)?.label ?? "Не указано";
};
