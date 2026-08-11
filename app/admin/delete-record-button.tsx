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
      <button className="inline-flex min-h-10 items-center justify-center border-2 border-black px-3 text-xs font-black hover:bg-black hover:text-white" type="submit">
        {label}
      </button>
    </form>
  );
}
