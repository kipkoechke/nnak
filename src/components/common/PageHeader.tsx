import { ReactNode } from "react";
import BackButton from "./BackButton";

interface PageHeaderProps {
  title: string | ReactNode;
  description?: string;
  action?: ReactNode;
  search?: ReactNode;
  back?: () => void;
}

export default function PageHeader({
  title,
  description,
  action,
  search,
  back,
}: PageHeaderProps) {
  return (
    <div className="bg-white p-3 md:p-4 rounded-lg border border-slate-200 shrink-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto md:flex-1 md:min-w-0">
          {back && <BackButton onClick={back} className="shrink-0" />}
          {typeof title === "string" ? (
            <div className="flex-1 min-w-0">
              <h1 className="text-base md:text-lg font-semibold text-slate-900 truncate">
                {title}
              </h1>
              {description && (
                <p className="text-xs text-slate-500 mt-0.5 hidden md:block truncate">
                  {description}
                </p>
              )}
            </div>
          ) : (
            <div className="flex-1 min-w-0">{title}</div>
          )}
          {/* Mobile Action Button */}
          <div className="md:hidden shrink-0">{action}</div>
        </div>
        {search && (
          <div className="flex-1 md:max-w-md md:mx-auto w-full">{search}</div>
        )}
        {/* Desktop Action Button */}
        {action && <div className="hidden md:block shrink-0">{action}</div>}
      </div>
    </div>
  );
}
