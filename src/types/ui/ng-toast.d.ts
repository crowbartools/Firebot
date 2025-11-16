export type NgToast = {
    create: (options: { content: string, timeout?: number, className?: string } | string) => void;
};
