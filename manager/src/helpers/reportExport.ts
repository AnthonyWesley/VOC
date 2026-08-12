type ReportColumn = {
  label: string;
  key: string;
};

export function downloadExcelReport(
  filename: string,
  columns: ReportColumn[],
  rows: Array<Record<string, string | number>>,
) {
  const thead = columns.map((column) => `<th>${column.label}</th>`).join("");
  const tbody = rows
    .map((row) => {
      const cells = columns
        .map((column) => `<td>${row[column.key] ?? ""}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
      </head>
      <body>
        <table border="1">
          <thead>
            <tr>${thead}</tr>
          </thead>
          <tbody>${tbody}</tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  link.click();
  URL.revokeObjectURL(link.href);
}
