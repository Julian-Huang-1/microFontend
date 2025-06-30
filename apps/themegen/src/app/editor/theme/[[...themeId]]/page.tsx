import { Header } from "@/components/header";
import { Loading } from "@/components/loading";
import { Suspense } from "react";

export default async function Component({ params }: { params: Promise<{ themeId: string[] }> }) {
  return (
    <div>
      <Header />
      <main>
        <Suspense fallback={<Loading />}>{/* <Editor /> */}</Suspense>
      </main>
    </div>
  );
}
