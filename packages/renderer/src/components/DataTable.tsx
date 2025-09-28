import { useCallback, useEffect, useRef } from "react";

interface Column<T = Record<string, unknown>> {
	key: keyof T | string;
	label: string;
	render?: (value: unknown, row: T) => React.ReactNode;
	sortable?: boolean;
}

interface DataTableProps<T = Record<string, unknown>> {
	data: T[];
	columns: Column<T>[];
	visibleColumns?: Record<string, boolean>;
	onCopy?: (selectedRows: T[]) => void;
	emptyState?: React.ReactNode;
	className?: string;
	tableRef?: React.RefObject<HTMLTableElement>;
	getRowKey?: (row: T, index: number) => string;
}

const DataTable = <T = Record<string, unknown>>({
	data,
	columns,
	visibleColumns,
	onCopy,
	emptyState,
	className = "",
	tableRef: externalTableRef,
	getRowKey = (_row: T, index: number) => `row-${index}`,
}: DataTableProps<T>) => {
	const internalTableRef = useRef<HTMLTableElement>(null);
	const tableRef = externalTableRef || internalTableRef;

	const handleTableCopy = useCallback(
		(e: ClipboardEvent) => {
			if (!tableRef.current || !onCopy) return;

			const selection = window.getSelection();
			if (!selection || selection.rangeCount === 0) return;

			const range = selection.getRangeAt(0);
			if (!tableRef.current.contains(range.commonAncestorContainer))
				return;

			// Prevent default copy and create HTML content
			e.preventDefault();

			let html = '<table border="1" style="border-collapse: collapse;">';
			let text = "";

			// Get selected table rows
			const selectedRows = Array.from(
				tableRef.current.querySelectorAll("tbody tr"),
			)
				.filter((row) => {
					const rowRange = document.createRange();
					rowRange.selectNodeContents(row);
					return selection.containsNode(
						rowRange.commonAncestorContainer,
						true,
					);
				})
				.map((_, index) => data[index])
				.filter(Boolean);

			if (selectedRows.length === 0) return;

			// Build header
			html += "<thead><tr>";
			const visibleCols = columns.filter(
				(col) =>
					!visibleColumns ||
					visibleColumns[col.key as string] !== false,
			);
			visibleCols.forEach((col) => {
				html += `<th style="padding: 8px; background-color: #f9fafb;">${col.label}</th>`;
				text += col.label + "\t";
			});
			html += "</tr></thead><tbody>";
			text += "\n";

			selectedRows.forEach((row) => {
				let rowHtml = "<tr>";
				let rowText = "";

				visibleCols.forEach((col) => {
					const value = (row as Record<string, unknown>)[
						col.key as string
					];
					const cellContent = col.render
						? col.render(value, row)
						: String(value || "");
					rowHtml += `<td style="padding: 8px;">${cellContent}</td>`;
					rowText += cellContent + "\t";
				});

				html += rowHtml + "</tr>";
				text += rowText.trim() + "\n";
			});

			html += "</tbody></table>";

			// Set clipboard data
			e.clipboardData?.setData("text/html", html);
			e.clipboardData?.setData("text/plain", text);

			// Call the onCopy callback
			onCopy(selectedRows);
		},
		[data, columns, visibleColumns, onCopy, tableRef],
	);

	// Attach copy event listener
	useEffect(() => {
		const table = tableRef.current;
		if (table && onCopy) {
			table.addEventListener("copy", handleTableCopy);
			return () => table.removeEventListener("copy", handleTableCopy);
		}
	}, [handleTableCopy, onCopy, tableRef]);

	if (data.length === 0) {
		return (
			emptyState || (
				<div className="text-center py-12">
					<p className="text-gray-500">No data available</p>
				</div>
			)
		);
	}

	const visibleCols = columns.filter(
		(col) => !visibleColumns || visibleColumns[col.key as string] !== false,
	);

	return (
		<div className={`overflow-x-auto ${className}`}>
			<table
				ref={tableRef}
				className="min-w-full divide-y divide-gray-200"
			>
				<thead className="bg-gray-50">
					<tr>
						{visibleCols.map((column) => (
							<th
								key={String(column.key)}
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								{column.label}
							</th>
						))}
					</tr>
				</thead>
				<tbody className="bg-white divide-y divide-gray-200">
					{data.map((row, index) => (
						<tr
							key={getRowKey(row, index)}
							className="hover:bg-gray-50"
						>
							{visibleCols.map((column) => (
								<td
									key={String(column.key)}
									className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
								>
									{column.render
										? column.render(
												(
													row as Record<
														string,
														unknown
													>
												)[column.key as string],
												row,
											)
										: String(
												(
													row as Record<
														string,
														unknown
													>
												)[column.key as string] || "",
											)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default DataTable;
