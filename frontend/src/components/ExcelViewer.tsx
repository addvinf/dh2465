import Button from "./ui/Button";

interface Props {
  data: any[];
  onEdit: () => void;
}

export default function ExcelViewer({ data, onEdit }: Props) {
  return (
    <div>
      <h2>Excel Data</h2>
      <table>
        <thead>
          <tr>
            {Object.keys(data[0] || {}).map((key) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {Object.values(row).map((val, j) => (
                <td key={j}>{String(val)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <Button onClick={onEdit}>Edit</Button>
    </div>
  );
}
