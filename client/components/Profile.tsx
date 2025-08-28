import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, MapPin, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    businessName: user?.businessName || "",
    email: user?.email || "",
    location: user?.location || "",
    description: user?.description || "",
  });

  const handleSave = async () => {
    await updateProfile(formData);
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Card className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-6 mb-8">
          <Avatar className="w-24 h-24">
            <AvatarImage
              src={user.profileImage || "/placeholder.svg"}
              alt={user.fullName || "User"}
            />
            <AvatarFallback>{user.fullName?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">
              {user.fullName || "Unnamed User"}
            </h2>
            {user.isVerified && (
              <Badge variant="default" className="bg-success mt-2">
                <Shield className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
            <p className="text-muted-foreground">{user.walletAddress}</p>
          </div>
        </div>

        {/* Info Section */}
        <div className="space-y-4">
          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Business Name
            </label>
            <Input
              value={formData.businessName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  businessName: e.target.value,
                }))
              }
              disabled={!isEditing}
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium mb-1 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email
            </label>
            <Input
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              disabled={!isEditing}
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-medium mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Location
            </label>
            <Input
              value={formData.location}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
              disabled={!isEditing}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              disabled={!isEditing}
              rows={4}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Profile;
