// app/auth/login/page.tsx
import LoginPage from './LoginPage';

type PageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  // searchParams is a Promise, so we await it
  const params = await searchParams;
  const callbackUrl =
    (params.callbackUrl as string | undefined) ?? '/home';

  return <LoginPage callbackUrl={callbackUrl} />;
}
