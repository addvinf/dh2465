import React from "react";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export default function Button(props: Props) {
  return (
    <button {...props} style={{ margin: "4px", padding: "8px 16px" }}>
      {props.children}
    </button>
  );
}
