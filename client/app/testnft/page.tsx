"use client"
import { useState } from "react";

export default function TestNFT() {
  const [result, setResult] = useState<any>(null);

  const handleCreateNFT = async () => {
    const res = await fetch("http://localhost:4000/api/web3nft/create-nft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product: "Cloves",
        origin: "Madagascar",
        quantity: "500 kg",
        priceHBAR: "6.5 HBAR/kg",
        HSCode: "0907.00"
      }),
    });

    const data = await res.json();
    setResult(data);
  };

  return (
    <div>
      <h1>Create NFT Product Test</h1>
      <button onClick={handleCreateNFT}>Mint NFT</button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
