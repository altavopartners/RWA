"use client";
import { useEffect, useState } from "react";
import BankDashboard from "@/components/BankOrderDetailsCard";

export function isConnected(): boolean {
    if (typeof document === "undefined") return false;
    const cookies = document.cookie.split("; ");
    console.log("Current cookies:", cookies);
    return cookies.some((cookie) => cookie.startsWith("bank_auth_token="));
}

export default function Page() {
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        setConnected(isConnected());
    }, []);

    if (!connected) {
        return <div>Please connect your bank (bankAccessToken cookie not found)</div>;
    }

    return <BankDashboard />;
}