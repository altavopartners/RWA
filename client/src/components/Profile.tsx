import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { 
  User, 
  Wallet, 
  MapPin, 
  Phone, 
  Mail, 
  Edit, 
  Save,
  Star,
  TrendingUp,
  Package,
  Shield,
  Globe,
  FileText
} from "lucide-react";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { user, walletAddress, isConnected, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    business_name: user?.business_name || "",
    email: user?.email || "",
    location: user?.location || "",
    description: user?.description || "",
  });

  const handleSave = async () => {
    await updateProfile(formData);
    setIsEditing(false);
  };

  if (!isConnected || !user) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Profile Dashboard</h1>
          <p className="text-xl text-muted-foreground">Please connect your wallet to view profile</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Products Listed", value: 12, icon: Package },
    { label: "Successful Sales", value: 45, icon: TrendingUp },
    { label: "Rating", value: 4.9, icon: Star },
    { label: "Verification", value: user.verified ? "Verified" : "Pending", icon: Shield }
  ];

  const recentActivity = [
    {
      id: "1",
      type: "product_listed",
      description: "Listed Premium Ghanaian Cocoa Beans",
      timestamp: "2 hours ago",
      status: "success"
    },
    {
      id: "2", 
      type: "order_completed",
      description: "Order #ORD-789 completed and payment received",
      timestamp: "1 day ago",
      status: "success"
    },
    {
      id: "3",
      type: "certificate_uploaded",
      description: "Uploaded organic certification for coffee beans",
      timestamp: "3 days ago",
      status: "success"
    }
  ];

  return (
    <div className="pt-20 min-h-screen">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your account and business information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Card */}
          <div className="lg:col-span-2">
            <Card className="glass border-border/50 p-8">
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
                <Avatar className="w-24 h-24">
                  <img src={user.avatar_url || "/placeholder.svg"} alt={user.name || "User"} className="w-full h-full object-cover" />
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{user.name || "Unnamed User"}</h2>
                    {user.verified && (
                      <Badge variant="default" className="bg-success">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-2">{user.business_name || "No business name"}</p>
                  <div className="flex items-center text-warning mb-2">
                    <Star className="w-4 h-4 fill-current mr-1" />
                    <span>4.9 Rating</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{user.location || "Location not set"}</span>
                  </div>
                </div>

                <Button
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                >
                  {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                  {isEditing ? "Save Changes" : "Edit Profile"}
                </Button>
              </div>

              {/* Profile Form */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <Input 
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-muted/50" : ""}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Business Name</label>
                    <Input 
                      value={formData.business_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-muted/50" : ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input 
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-muted/50" : ""}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <Input 
                      value="+233 24 567 8900"
                      disabled
                      className="bg-muted/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <Input 
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted/50" : ""}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Business Description</label>
                  <Textarea 
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted/50" : ""}
                    rows={4}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Wallet Info */}
            <Card className="glass border-border/50 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Wallet className="w-5 h-5 mr-2" />
                Wallet & Identity
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Wallet Address</label>
                  <div className="p-3 bg-muted/50 rounded-lg font-mono text-sm">
                    {walletAddress}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Decentralized ID</label>
                  <div className="p-3 bg-muted/50 rounded-lg font-mono text-sm break-all">
                    {user.did}
                  </div>
                </div>

                <Button 
                  variant="accent"
                  className="w-full"
                  disabled
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Wallet Connected
                </Button>
              </div>
            </Card>

            {/* Stats */}
            <Card className="glass border-border/50 p-6">
              <h3 className="text-lg font-semibold mb-4">Profile Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <stat.icon className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="glass border-border/50 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Recent Activity
              </h3>
              
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-2 h-2 bg-success rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full mt-4">
                <FileText className="w-4 h-4 mr-2" />
                View All Activity
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;