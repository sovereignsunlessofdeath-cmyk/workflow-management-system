import Header from "../components/layout/Header";

type SimplePageProps = {
  title: string;
  subtitle: string;
};

export default function SimplePage({
  title,
  subtitle,
}: SimplePageProps) {
  return (
    <>
      <Header title={title} subtitle={subtitle} />

      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800">
            {title}
          </h2>

          <p className="mt-2 text-slate-500">
            This module will be connected to the backend next.
          </p>
        </div>
      </div>
    </>
  );
}