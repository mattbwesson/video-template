import React, { useCallback, useRef, useState } from "react";

/**
 * A label that is a file input, a drop target and a paste target at once.
 *
 * All three drop-zones in the wizard (headshot, logo, image grid) behave identically, so
 * the drag-over state, the `preventDefault` dance and the hidden input live here once.
 */

export const useDropzone = (onFiles: (files: FileList | File[]) => void) => {
  const [over, setOver] = useState(false);

  const stop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return {
    over,
    handlers: {
      onDragEnter: (e: React.DragEvent) => {
        stop(e);
        setOver(true);
      },
      onDragOver: (e: React.DragEvent) => {
        stop(e);
        setOver(true);
      },
      onDragLeave: (e: React.DragEvent) => {
        stop(e);
        setOver(false);
      },
      onDrop: (e: React.DragEvent) => {
        stop(e);
        setOver(false);
        if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
      },
    },
  };
};

export const FileDrop: React.FC<{
  className: string;
  multiple?: boolean;
  label: string;
  onFiles: (files: FileList | File[]) => void;
  children: React.ReactNode;
  /** Lets a parent open the picker — the "+" tile in the image grid uses this. */
  inputRef?: React.RefObject<HTMLInputElement>;
}> = ({ className, multiple, label, onFiles, children, inputRef }) => {
  const own = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? own;
  const { over, handlers } = useDropzone(onFiles);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) onFiles(e.target.files);
      // Reset so re-picking the same file fires `change` again.
      e.target.value = "";
    },
    [onFiles],
  );

  return (
    <label className={`${className}${over ? " vc-over" : ""}`} {...handlers}>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        aria-label={label}
        onChange={onChange}
      />
      {children}
    </label>
  );
};
