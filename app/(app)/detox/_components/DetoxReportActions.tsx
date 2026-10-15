"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/core/Button.jsx";
import { Icon } from "@/components/core/Icon.jsx";
import { ConfirmDialog } from "@/app/(app)/open-source/_components/ConfirmDialog";
import { deleteDetox } from "../actions";

const IMAGE_URL = "/detox/report/image";

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

/** The before and after card as an image, plus Retake and Delete my results. The JPG is made in the browser. */
export function DetoxReportActions() {
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
        save(png, "skillflow-detox.png");
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
      save(jpg, "skillflow-detox.jpg");
    } catch {
      setError("The image could not be made. Try again.");
    } finally {
      setBusy("");
    }
  }

  async function clear(next: "retake" | "delete") {
    setBusy("delete");
    const result = await deleteDetox();
    setBusy("");
    setConfirm("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(next === "retake" ? "/detox/check" : "/detox");
    router.refresh();
  }

  return (
    <div className="sf-dtx-report-actions">
      <Button variant="gradient" pending={busy === "png"} pendingLabel="Making PNG…" disabled={busy !== ""} onClick={() => void download("png")}>
        <Icon name="download" size={16} />
        Download PNG
      </Button>
      <Button variant="outline" pending={busy === "jpg"} pendingLabel="Making JPG…" disabled={busy !== ""} onClick={() => void download("jpg")}>
        Download JPG
      </Button>
      <Button variant="ghost" disabled={busy !== ""} onClick={() => setConfirm("retake")}>
        Retake the check
      </Button>
      <Button variant="ghost" disabled={busy !== ""} onClick={() => setConfirm("delete")}>
        Delete my results
      </Button>
      {error ? (
        <p className="sf-auth-error" role="alert">
          {error}
        </p>
      ) : null}
      <ConfirmDialog open={confirm !== ""} title={confirm === "retake" ? "Retake the self-check?" : "Delete your Detox results?"} onClose={() => setConfirm("")}>
        <p>
          {confirm === "retake"
            ? "Your answers, score, check-ins, and focus sessions are deleted, and the self-check starts again. Your learning stays."
            : "Your answers, score, check-ins, and focus sessions are deleted for good. Your learning, notes, and progress stay."}
        </p>
        <div className="sf-review-actions">
          <Button variant="ghost" onClick={() => setConfirm("")}>
            Keep my results
          </Button>
          <Button variant="gradient" pending={busy === "delete"} pendingLabel="Deleting…" onClick={() => void clear(confirm === "retake" ? "retake" : "delete")}>
            {confirm === "retake" ? "Delete and start again" : "Delete"}
          </Button>
        </div>
      </ConfirmDialog>
    </div>
  );
}
