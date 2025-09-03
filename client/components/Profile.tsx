import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, MapPin, Mail, Camera } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    businessName: "",
    email: "",
    location: "",
    description: "",
    profileImage: "",
  });

  // Sync formData with user
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        businessName: user.businessName || "",
        email: user.email || "",
        location: user.location || "",
        description: user.description || "",
        profileImage: user.profileImage || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    await updateProfile({
      fullName: formData.fullName,
      email: formData.email,
      location: formData.location,
      businessName: formData.businessName,
      description: formData.description,
      profileImage: formData.profileImage,
    });
    setIsEditing(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        profileImage: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  if (!user)
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );

  return (
    <div className="container py-8">
      <Card className="max-w-3xl mx-auto p-6">
        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage
                src={formData.profileImage || "/placeholder.svg"}
                alt={formData.fullName || "User"}
              />
              <AvatarFallback>
                {formData.fullName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <label className="absolute bottom-0 right-0 cursor-pointer p-1 bg-white rounded-full border shadow">
                <Camera className="w-5 h-5 text-gray-700" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <div>
            <Input
              value={formData.fullName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, fullName: e.target.value }))
              }
              disabled={!isEditing}
              className="text-2xl font-bold p-0 border-0 text-gray-900 bg-transparent"
            />
            {user.isVerified && (
              <Badge
                variant="default"
                className="bg-success mt-2 flex items-center gap-1"
              >
                <Shield className="w-3 h-3" /> Verified
              </Badge>
            )}
            <p className="text-muted-foreground">{user.walletAddress}</p>
          </div>
        </div>

        <div className="space-y-4">
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
