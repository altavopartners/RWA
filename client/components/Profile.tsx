"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Mail, Camera, Phone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWalletConnect } from "@/hooks/useWalletConnect";

const Profile = () => {
  const { isConnected } = useAuth();
  const { triggerConnect } = useWalletConnect();

  useEffect(() => {
    if (!isConnected) {
      triggerConnect();
    }
  }, [isConnected, triggerConnect]);

  if (!isConnected) {
    return (
      <div className="pt-20 min-h-screen">
        <div className="container mx-auto px-6 py-8">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Profile Access Required</h2>
            <p className="text-muted-foreground">Please connect your wallet to view your profile.</p>
          </Card>
        </div>
      </div>
    );
  }

  return <ProfileContent />;
};

function ProfileContent() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    businessName: "",
    email: "",
    phoneNumber: "",
    location: "",
    businessDesc: "",
    profileImage: "",
  });

  // Sync formData with user
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        businessName: user.businessName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        location: user.location || "",
        businessDesc: user.businessDesc || "",
        profileImage: user.profileImage || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    await updateProfile({
      fullName: formData.fullName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      location: formData.location,
      businessName: formData.businessName,
      businessDesc: formData.businessDesc,
      profileImage: formData.profileImage,
    });
    setIsEditing(false);
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-$$$$]/g, ""));
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

  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <Card className="p-8 glass border-border/50">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-10 pb-6 border-b border-border/50">
          <div className="relative">
            <Avatar className="w-28 h-28">
              <AvatarImage
                src={formData.profileImage || "/placeholder.svg"}
                alt={formData.fullName || "User"}
              />
              <AvatarFallback className="text-xl text-primary">
                {formData.fullName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <label className="absolute bottom-0 right-0 cursor-pointer p-2 bg-white rounded-full border shadow-md hover:shadow-lg transition-shadow">
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
          <div className="flex-1">
            <Input
              value={formData.fullName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, fullName: e.target.value }))
              }
              disabled={!isEditing}
              className="text-3xl font-bold p-0 border-0 bg-transparent mb-3 text-primary placeholder:text-primary/50"
              placeholder="Enter your full name"
            />
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <Badge variant="outline" className="text-xs text-primary/80">
                {user?.walletAddress
                  ? `${user.walletAddress.slice(
                      0,
                      8
                    )}...${user.walletAddress.slice(-6)}`
                  : "No wallet address"}
              </Badge>
            </div>
            <p className="text-primary/80 text-sm">
              {formData.businessName || "Business name not set"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Personal Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-primary">
                Personal Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-primary/80">
                    Full Name
                  </label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    placeholder="Enter your full name"
                    className="placeholder:text-primary/50"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2 text-primary/80">
                    <Mail className="w-4 h-4 text-blue-600" /> Email Address
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    placeholder="Enter your email address"
                    className="placeholder:text-primary/50"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2 text-primary/80">
                    <Phone className="w-4 h-4 text-green-600" /> Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phoneNumber: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    placeholder="+1 (555) 123-4567"
                    className={
                      isEditing &&
                      formData.phoneNumber &&
                      !validatePhoneNumber(formData.phoneNumber)
                        ? "border-red-500 focus:border-red-500"
                        : "placeholder:text-primary/50"
                    }
                  />
                  {isEditing &&
                    formData.phoneNumber &&
                    !validatePhoneNumber(formData.phoneNumber) && (
                      <p className="text-red-500 text-xs mt-1">
                        Please enter a valid phone number
                      </p>
                    )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2 text-primary/80">
                    <MapPin className="w-4 h-4 text-red-600" /> Location
                  </label>
                  <Input
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    placeholder="City, Country"
                    className="placeholder:text-primary/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Business Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-primary">
                Business Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-primary/80">
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
                    placeholder="Enter your business name"
                    className="placeholder:text-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-primary/80">
                    Business Description
                  </label>
                  <Textarea
                    value={formData.businessDesc}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        businessDesc: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    rows={6}
                    placeholder="Describe your business, products, and services..."
                    className="resize-none placeholder:text-primary/50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-border/50">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="sm:w-auto w-full"
              >
                Cancel Changes
              </Button>
              <Button
                onClick={handleSave}
                className="sm:w-auto w-full"
                disabled={
                  !!(
                    isEditing &&
                    formData.phoneNumber &&
                    !validatePhoneNumber(formData.phoneNumber)
                  )
                }
              >
                Save Profile
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              className="sm:w-auto w-full"
            >
              Edit Profile
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

export default Profile;
