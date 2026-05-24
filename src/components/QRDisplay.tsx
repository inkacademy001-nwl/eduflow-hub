import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function QRDisplay() {
  const [token, setToken] = useState("");

  const fetchQR = async () => {
    const res = await api.get("/qr");
    setToken(res.token);
  };

  useEffect(() => {
    fetchQR();
    const interval = setInterval(fetchQR, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>Scan QR</h2>
      <div>{token}</div>
    </div>
  );
}