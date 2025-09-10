import { BankHeader } from "@/components/bank-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, FileText, Shield, Scale, TrendingUp, AlertTriangle } from "lucide-react"

export default function BankDashboard() {
  return (
    <div className="space-y-6 p-6">
      <BankHeader
        title="Compliance Dashboard"
        description="Monitor KYC validation, document verification, and escrow management"
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-destructive">+3</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Queue</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-accent">+7</span> new submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Escrows</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-chart-5">2</span> awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Disputes</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-destructive">1</span> high priority
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest compliance actions and updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-chart-5 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">KYC Approved</p>
                  <p className="text-xs text-muted-foreground">ABC Trading Corp</p>
                </div>
              </div>
              <Badge variant="secondary">2 min ago</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-chart-1 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Document Validated</p>
                  <p className="text-xs text-muted-foreground">Certificate of Origin</p>
                </div>
              </div>
              <Badge variant="secondary">5 min ago</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Escrow Signed</p>
                  <p className="text-xs text-muted-foreground">Order #ESC-2024-001</p>
                </div>
              </div>
              <Badge variant="secondary">12 min ago</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Priority Actions
            </CardTitle>
            <CardDescription>Items requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
              <div>
                <p className="text-sm font-medium">High-Value KYC Review</p>
                <p className="text-xs text-muted-foreground">Global Exports Ltd - $2.5M order</p>
              </div>
              <Badge variant="destructive">Urgent</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
              <div>
                <p className="text-sm font-medium">Dispute Arbitration</p>
                <p className="text-xs text-muted-foreground">Quality claim - Order #ORD-2024-156</p>
              </div>
              <Badge className="bg-accent text-accent-foreground">Review</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-chart-4/10 rounded-lg">
              <div>
                <p className="text-sm font-medium">Escrow Expiring</p>
                <p className="text-xs text-muted-foreground">Auto-release in 24 hours</p>
              </div>
              <Badge variant="outline">Warning</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
