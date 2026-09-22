export const PWA_OPEN_INSTALL_MODAL = "pwa-open-install-modal";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

export const setGlobalDeferredPrompt = (e: BeforeInstallPromptEvent | null): void => {
  globalDeferredPrompt = e;
};

export const getGlobalDeferredPrompt = (): BeforeInstallPromptEvent | null => {
  return globalDeferredPrompt;
};

export const isAppStandalone = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as unknown as { standalone?: boolean }).standalone)
  );
};

export const isIosDevice = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
};

export const openPwaInstallModal = (): void => {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(PWA_OPEN_INSTALL_MODAL));
};

export const triggerInstallPrompt = async (): Promise<"accepted" | "dismissed" | "unsupported"> => {
  if (globalDeferredPrompt) {
    try {
      await globalDeferredPrompt.prompt();
      const { outcome } = await globalDeferredPrompt.userChoice;
      if (outcome === "accepted") {
        globalDeferredPrompt = null;
      }
      return outcome;
    } catch {
      return "unsupported";
    }
  }
  return "unsupported";
};
