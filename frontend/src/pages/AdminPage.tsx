import ExcelUpload from "../components/ExcelUpload";
import ExcelViewer from "../components/ExcelViewer";
import ExcelEditor from "../components/ExcelEditor";
import { useState } from "react";

export default function AdminPage() {
  const [excelData, setExcelData] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);

  return (
    <div>
      <h1>Admin Portal</h1>
      <ExcelUpload onData={setExcelData} />
      {excelData.length > 0 && !editing && (
        <ExcelViewer data={excelData} onEdit={() => setEditing(true)} />
      )}
      {editing && (
        <ExcelEditor
          data={excelData}
          onSave={setExcelData}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}
