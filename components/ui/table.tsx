import * as React from "react";
import { cn } from "@/lib/utils";

export const Table = React.forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-x-auto -mx-px rounded-[16px] md:rounded-[24px] border border-forex-border overscroll-x-contain">
      <table ref={ref} className={cn("w-full min-w-[600px] border-collapse text-left text-sm", className)} {...props} />
    </div>
  )
);
Table.displayName = "Table";

export const TableHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn("bg-white/5 text-forex-muted", className)} {...props} />
);

export const TableBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn("[&_tr:last-child]:border-b-0", className)} {...props} />
);

export const TableRow = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn("border-b border-forex-border/90 transition hover:bg-white/[0.03]", className)} {...props} />
);

export const TableHead = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn("px-3 py-2.5 md:px-4 md:py-3 text-[10px] md:text-xs font-semibold uppercase tracking-premium whitespace-nowrap", className)} {...props} />
);

export const TableCell = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn("px-3 py-3 md:px-4 md:py-4 text-forex-text text-xs md:text-sm", className)} {...props} />
);
