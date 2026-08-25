import { meta } from "./meta";

export default function Blog() {
  return (
    <section className="relative flex min-h-0 flex-1 flex-col">
      <div className="panel flex min-h-0 flex-1 overflow-hidden bg-white">
        <iframe
          title="我的博客"
          src={meta.externalUrl}
          className="h-full w-full border-0"
        />
      </div>
    </section>
  );
}
