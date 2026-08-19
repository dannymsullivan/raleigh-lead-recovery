"use client";

export function DeleteRecordButton({
  action,
  label,
  confirmMessage
}: {
  action: () => void | Promise<void>;
  label: string;
  confirmMessage: string;
}) {
  return (
    <form action={action} onSubmit={(event) => { if (!window.confirm(confirmMessage)) event.preventDefault(); }}>
      <button className="inline-flex min-h-10 items-center justify-center border-2 border-red-700 px-3 text-xs font-black text-red-700 transition-colors hover:bg-red-700 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700" type="submit">
        {label}
      </button>
    </form>
  );
}
