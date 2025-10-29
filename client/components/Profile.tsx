"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Mail, Camera, Phone, User, Building2, Edit3, Save, X, Wallet, Package, ShoppingCart, TrendingUp, Shield } from "lucide-react";
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
      <div className="pt-32 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="container mx-auto px-6 py-8">
          <Card className="p-12 text-center max-w-md mx-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="w-20 h-20 bg-[#88CEDC]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-10 h-10 text-[#88CEDC]" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
              Profile Access Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please connect your wallet to view and edit your profile.
            </p>
            <Button 
              onClick={triggerConnect}
              className="bg-[#88CEDC] hover:bg-[#7BC0CF] text-white"
            >
              Connect Wallet
            </Button>
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
    return phoneRegex.test(phone.replace(/[\s\-()]/g, ""));
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

  // Mock stats - replace with real data from your backend
  const stats = [
    { icon: Package, label: "Products Listed", value: "12", color: "from-blue-500 to-blue-600" },
    { icon: ShoppingCart, label: "Orders Placed", value: "8", color: "from-green-500 to-green-600" },
    { icon: TrendingUp, label: "Total Sales", value: "2.5K HBAR", color: "from-purple-500 to-purple-600" },
    { icon: Shield, label: "Account Status", value: "Verified", color: "from-[#88CEDC] to-[#5BA8B8]" },
  ];

  return (
    <div className="pt-32 min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 [&_::selection]:bg-[#88CEDC]/30 [&_::selection]:text-gray-900 dark:[&_::selection]:bg-[#88CEDC]/50 dark:[&_::selection]:text-white">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            My Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your personal and business information
          </p>
        </div>

        {/* Profile Header Card with Gradient */}
        <Card className="p-8 mb-6 bg-gradient-to-br from-[#88CEDC] to-[#5BA8B8] border-0 relative overflow-hidden shadow-xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-white/20 rounded-full blur-xl group-hover:bg-white/30 transition-all" />
              <Avatar className="relative w-32 h-32 border-4 border-white shadow-2xl">
                <AvatarImage
                  src={formData.profileImage || "/placeholder.svg"}
                  alt={formData.fullName || "User"}
                />
                <AvatarFallback className="text-3xl bg-white text-[#88CEDC] font-bold">
                  {formData.fullName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <label className="absolute bottom-0 right-0 cursor-pointer p-3 bg-white rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-110 z-10">
                  <Camera className="w-5 h-5 text-[#88CEDC]" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                {formData.fullName || "User"}
              </h2>
              <p className="text-white/90 text-lg mb-3 drop-shadow">
                {formData.businessName || "Business name not set"}
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm hover:bg-white/30 transition-all">
                  <Wallet className="w-3 h-3 mr-1" />
                  {user?.walletAddress
                    ? `${user.walletAddress.slice(0, 8)}...${user.walletAddress.slice(-6)}`
                    : "No wallet"}
                </Badge>
                {formData.location && (
                  <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm hover:bg-white/30 transition-all">
                    <MapPin className="w-3 h-3 mr-1" />
                    {formData.location}
                  </Badge>
                )}
              </div>
            </div>

            <Button
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              className="bg-white text-[#88CEDC] hover:bg-white/90 font-semibold px-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              disabled={
                !!(isEditing &&
                formData.phoneNumber &&
                !validatePhoneNumber(formData.phoneNumber))
              }
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information Card */}
          <Card className="p-8 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#88CEDC] to-[#5BA8B8] flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Personal Information
              </h3>
            </div>

            <div className="space-y-5">
              <div className="group">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-[#88CEDC] transition-colors" />
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
                    className={`pl-10 transition-all font-semibold ${
                      !isEditing
                        ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                        : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-[#88CEDC] dark:focus:border-[#88CEDC] text-gray-900 dark:text-white"
                    }`}
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-[#88CEDC] transition-colors" />
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
                    className={`pl-10 transition-all font-medium ${
                      !isEditing
                        ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                        : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-[#88CEDC] dark:focus:border-[#88CEDC] text-gray-900 dark:text-white"
                    }`}
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-[#88CEDC] transition-colors" />
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
                    className={`pl-10 transition-all font-medium ${
                      !isEditing
                        ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                        : isEditing &&
                          formData.phoneNumber &&
                          !validatePhoneNumber(formData.phoneNumber)
                        ? "border-red-500 focus:border-red-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-[#88CEDC] dark:focus:border-[#88CEDC] text-gray-900 dark:text-white"
                    }`}
                  />
                </div>
                {isEditing &&
                  formData.phoneNumber &&
                  !validatePhoneNumber(formData.phoneNumber) && (
                    <p className="text-red-500 text-xs mt-1 ml-1 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full" />
                      Please enter a valid phone number
                    </p>
                  )}
              </div>

              <div className="group">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-[#88CEDC] transition-colors" />
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
                    className={`pl-10 transition-all font-medium ${
                      !isEditing
                        ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                        : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-[#88CEDC] dark:focus:border-[#88CEDC] text-gray-900 dark:text-white"
                    }`}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Business Information Card */}
          <Card className="p-8 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#88CEDC] to-[#5BA8B8] flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Business Information
              </h3>
            </div>

            <div className="space-y-5">
              <div className="group">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Business Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-[#88CEDC] transition-colors" />
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
                    className={`pl-10 transition-all font-medium ${
                      !isEditing
                        ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                        : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-[#88CEDC] dark:focus:border-[#88CEDC] text-gray-900 dark:text-white"
                    }`}
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
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
                  rows={11}
                  placeholder="Describe your business, products, and services..."
                  className={`resize-none transition-all font-medium ${
                    !isEditing
                      ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                      : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-[#88CEDC] dark:focus:border-[#88CEDC] text-gray-900 dark:text-white"
                  }`}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="px-6 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;