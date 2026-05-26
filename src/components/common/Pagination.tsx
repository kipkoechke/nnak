"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: PaginationProps) {
  return (
    <div className="bg-white px-3 md:px-4 py-2 border-t border-slate-200 flex items-center justify-between gap-2 rounded-b-lg shrink-0">
      <p className="text-xs md:text-sm text-slate-500 shrink-0">
        <span className="hidden sm:inline">Page </span>
        {currentPage}
        <span className="hidden sm:inline"> of {totalPages}</span>
        <span className="sm:hidden">/{totalPages}</span>
        <span className="hidden md:inline"> ({totalItems} total)</span>
      </p>
      <div className="flex items-center gap-1 md:gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-2 md:px-4 py-1 text-xs md:text-sm bg-primary text-white border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-slate-400 hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Prev</span>
        </button>
        <span className="text-xs md:text-sm text-slate-600 px-1 md:px-2 hidden sm:block">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="px-2 md:px-4 py-1 text-xs md:text-sm bg-primary text-white border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-slate-400 hover:bg-primary/90 transition-colors cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
}
