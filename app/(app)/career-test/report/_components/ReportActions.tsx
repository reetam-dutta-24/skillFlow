"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { ConfirmDialog } from "@/app/(app)/open-source/_components/ConfirmDialog";
import { deleteCareerTest } from "../../actions";

const IMAGE_URL = "/career-test/report/image";

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Image export and the two ways to clear the result. The JPG is made in the browser from the server's PNG. */
export function ReportActions() {
  const router = useRouter();
  const [busy, setBusy] = useState<"" | "png" | "jpg" | "delete">("");
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<"" | "retake" | "delete">("");

  async function download(format: "png" | "jpg") {
    setBusy(format);
    setError("");
    try {
      const response = await fetch(IMAGE_URL, { cache: "no-store" });
      if (!response.ok) throw new Error("image");
      const png = await response.blob();
      if (format === "png") {
        save(png, "skillflow-career-fit.png");
        return;
      }
      const bitmap = await createImageBitmap(png);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("canvas");
      context.drawImage(bitmap, 0, 0);
      const jpg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!jpg) throw new Error("jpeg");
      save(jpg, "skillflow-career-fit.jpg");
    } catch {
      setError("The image could not be made. Try again.");
    } finally {
      setBusy("");
    }
  }

  async function clear(next: "retake" | "delete") {
    setBusy("delete");
    const result = await deleteCareerTest();
    setBusy("");
    setConfirm("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(next === "retake" ? "/career-test" : "/dashboard");
    router.refresh();
  }

  return (
    <div className="sf-rep-actions">
      <Button type="button" variant="gradient" pending={busy === "png"} pendingLabel="Making PNG…" disabled={busy !== ""} onClick={() => void download("png")}>
        Download PNG
      </Button>
      <Button type="button" variant="outline" pending={busy === "jpg"} pendingLabel="Making JPG…" disabled={busy !== ""} onClick={() => void download("jpg")}>
        Download JPG
      </Button>
      <Button type="button" variant="ghost" disabled={busy !== ""} onClick={() => setConfirm("retake")}>
        Retake the test
      </Button>
      <Button type="button" variant="ghost" disabled={busy !== ""} onClick={() => setConfirm("delete")}>
        Delete my results
      </Button>
      {error ? (
        <p className="sf-auth-error" role="alert">
          {error}
        </p>
      ) : null}
      <ConfirmDialog
        open={confirm !== ""}
        title={confirm === "retake" ? "Retake the test?" : "Delete your results?"}
        onClose={() => setConfirm("")}
      >
        <p>
          {confirm === "retake"
            ? "Your answers and this report are deleted, and the test starts again from the first question."
            : "Your answers and this report are deleted for good. You can take the test again later."}
        </p>
        <div className="sf-review-actions">
          <Button type="button" variant="ghost" onClick={() => setConfirm("")}>
            Keep my report
          </Button>
          <Button
            type="button"
            variant="gradient"
            pending={busy === "delete"}
            pendingLabel="Deleting…"
            onClick={() => void clear(confirm === "retake" ? "retake" : "delete")}
          >
            {confirm === "retake" ? "Delete and start again" : "Delete"}
          </Button>
        </div>
      </ConfirmDialog>
    </div>
  );
}
