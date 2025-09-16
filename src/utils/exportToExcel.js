import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


 const exportToExcel= (data, fileName) => {
    const ws = XLSX.utils.json_to_sheet(data); // JSON -> Sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sayfa1");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, fileName);
};

export default exportToExcel