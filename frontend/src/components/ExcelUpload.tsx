import { readExcelFile } from "../utils/excelUtils";

interface Props {
  onData: (data: any[]) => void;
}

export default function ExcelUpload({ onData }: Props) {
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const data = await readExcelFile(file);
      onData(data);
    }
  };

  return (
    <div>
      <input type="file" accept=".xlsx,.xls" onChange={handleFile} />
    </div>
  );
}
