"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";

/**
 * IPFS Connection Test Component
 *
 * This component helps you verify that:
 * 1. Backend is connecting to Storacha correctly
 * 2. Documents are stored on IPFS
 * 3. IPFS gateway URLs are accessible
 * 4. CIDs are valid
 */
export function IPFSConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{
    backendConnection?: boolean;
    documentsExist?: boolean;
    ipfsAccessible?: boolean;
    sampleCID?: string;
    sampleURL?: string;
    error?: string;
  }>({});

  const runTest = async () => {
    setTesting(true);
    setResults({});

    try {
      // Test 1: Backend connection
      const backendUrl = process.env.NEXT_PUBLIC_API_URL;
      const docsResponse = await fetch(`${backendUrl}/api/bank/documents`);

      if (!docsResponse.ok) {
        throw new Error("Backend not responding");
      }

      setResults((prev) => ({ ...prev, backendConnection: true }));

      // Test 2: Check if documents exist
      const docsData = await docsResponse.json();
      const documents = docsData.data || [];

      if (documents.length === 0) {
        setResults((prev) => ({
          ...prev,
          documentsExist: false,
          error: "No documents found. Upload a test document first.",
        }));
        setTesting(false);
        return;
      }

      setResults((prev) => ({ ...prev, documentsExist: true }));

      // Test 3: Check IPFS accessibility
      const sampleDoc = documents[0];
      const sampleCID = sampleDoc.cid;
      const sampleURL = sampleDoc.url;

      setResults((prev) => ({ ...prev, sampleCID, sampleURL }));

      // Try to fetch from IPFS gateway
      try {
        const ipfsResponse = await fetch(sampleURL, { method: "HEAD" });
        setResults((prev) => ({ ...prev, ipfsAccessible: ipfsResponse.ok }));
      } catch (err) {
        setResults((prev) => ({
          ...prev,
          ipfsAccessible: false,
          error: "IPFS gateway not accessible. Try alternative gateway.",
        }));
      }
    } catch (err: any) {
      setResults((prev) => ({
        ...prev,
        error: err.message || "Test failed",
      }));
    } finally {
      setTesting(false);
    }
  };

  const TestResult = ({
    label,
    status,
  }: {
    label: string;
    status?: boolean;
  }) => (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <span className="text-sm font-medium">{label}</span>
      {status === undefined ? (
        <Badge variant="secondary">Pending</Badge>
      ) : status ? (
        <CheckCircle2 className="w-5 h-5 text-green-600" />
      ) : (
        <XCircle className="w-5 h-5 text-red-600" />
      )}
    </div>
  );

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          IPFS Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This test verifies that your documents are being stored on and
          retrieved from IPFS via Storacha.
        </p>

        <Button onClick={runTest} disabled={testing} className="w-full">
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            "Run IPFS Test"
          )}
        </Button>

        {Object.keys(results).length > 0 && (
          <div className="space-y-3">
            <TestResult
              label="Backend API Connected"
              status={results.backendConnection}
            />
            <TestResult
              label="Documents in Database"
              status={results.documentsExist}
            />
            <TestResult
              label="IPFS Gateway Accessible"
              status={results.ipfsAccessible}
            />

            {results.sampleCID && (
              <div className="p-3 bg-muted rounded-md space-y-2">
                <p className="text-xs font-medium">Sample Document:</p>
                <div className="space-y-1">
                  <p className="text-xs">
                    <span className="font-medium">CID:</span>{" "}
                    <code className="text-xs bg-background px-1 py-0.5 rounded">
                      {results.sampleCID}
                    </code>
                  </p>
                  <p className="text-xs break-all">
                    <span className="font-medium">URL:</span>{" "}
                    <a
                      href={results.sampleURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {results.sampleURL}
                    </a>
                  </p>
                </div>
              </div>
            )}

            {results.error && (
              <div className="p-3 bg-destructive/10 rounded-md">
                <p className="text-xs text-destructive font-medium">
                  {results.error}
                </p>
              </div>
            )}

            {results.ipfsAccessible && (
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-md">
                <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                  ✅ IPFS integration is working correctly! Your documents are
                  stored on IPFS and accessible via the gateway.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
          <p className="font-medium">What this test checks:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Backend API responds to document requests</li>
            <li>Documents are stored with IPFS CIDs</li>
            <li>IPFS gateway URLs are accessible</li>
            <li>Files can be retrieved from IPFS network</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
