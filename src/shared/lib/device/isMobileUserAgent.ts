export const isMobileUserAgent = (userAgent: string): boolean => {
  return /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
};
