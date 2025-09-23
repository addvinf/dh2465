import { useState } from "react";
import Button from "./ui/Button";

interface Props {
  data: any[];
  onSave: (data: any[]) => void;
  onCancel: () => void;
}

export default function ExcelEditor({ data, onSave, onCancel }: Props) {
  const [editData, setEditData] = useState<any[]>(data);

  const handleChange = (rowIdx: number, key: string, value: string) => {
    const updated = editData.map((row, i) =>
      i === rowIdx ? { ...row, [key]: value } : row
    );
    setEditData(updated);
  };

  return (
    <div>
      <h2>Edit Excel Data</h2>
      <table>
        <thead>
          <tr>
            {Object.keys(editData[0] || {}).map((key) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {editData.map((row, i) => (
            <tr key={i}>
              {Object.entries(row).map(([key, val], j) => (
                <td key={j}>
                  <input
                    value={String(val)}
                    onChange={(e) => handleChange(i, key, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <Button onClick={() => onSave(editData)}>Save</Button>
      <Button onClick={onCancel}>Cancel</Button>
    </div>
  );
}
