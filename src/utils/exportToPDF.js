import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import formatTL from"./formatTL";

const exportToPDF = (columns, data, fileName) => {
    const doc = new jsPDF();

    // PDF için font ekleyebilirsin (UTF-8 Türkçe destek)
    // Örn: doc.setFont("helvetica");

    const tableColumn = columns.map((col) => col.title);
    const tableRows = data.map((row) =>
        columns.map((col) => {
            if (col.dataIndex === "total") return formatTL(row[col.dataIndex]);
            return row[col.dataIndex];
        })
    );

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
    });

    doc.save(fileName);
};

export default exportToPDF