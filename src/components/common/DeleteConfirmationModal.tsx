"use client";

import React from "react";
import Button from "./Button";

interface DeleteConfirmationModalProps {
  itemName: string;
  itemType?: string;
  onConfirm: () => void;
  isDeleting: boolean;
  onCloseModal?: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  pendingLabel?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  itemName,
  itemType = "item",
  onConfirm,
  isDeleting,
  onCloseModal,
  title,
  message,
  confirmLabel = "Delete",
  pendingLabel,
}) => {
  const handleConfirm = async () => {
    await onConfirm();
    onCloseModal?.();
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {title ?? `Delete ${itemType}`}
      </h3>
      <p className="text-gray-600 mb-6">
        {message ?? (
          <>
            Are you sure you want to delete &quot;{itemName}&quot;? This action
            cannot be undone.
          </>
        )}
      </p>
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="secondary" onClick={onCloseModal} disabled={isDeleting}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={handleConfirm}
          disabled={isDeleting}
          className="bg-red-600 hover:bg-red-700"
        >
          {isDeleting ? (pendingLabel ?? "Deleting...") : confirmLabel}
        </Button>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
