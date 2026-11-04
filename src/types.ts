// Global type definitions for Next.js App Router props

export type PageProps<Route extends string = string> = {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | string[]>>;
};

export type LayoutProps<Route extends string = string> = {
  children: React.ReactNode;
  params?: Promise<Record<string, string>>;
};
