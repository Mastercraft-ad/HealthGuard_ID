import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, User, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import imageCompression from 'browser-image-compression';

export default function ProfilePictureUpload() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: userData } = useQuery<any>({
    queryKey: ["/api/user/profile"],
  });

  const uploadMutation = useMutation({
    mutationFn: (profilePicture: string) => 
      apiRequest("POST", "/api/user/profile-picture", { profilePicture }),
    onSuccess: () => {
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: file.type as any,
      };

      const compressedFile = await imageCompression(file, options);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        
        if (result.length > 10 * 1024 * 1024) {
          toast({
            title: "File Too Large",
            description: "Compressed image is still too large. Please try a smaller image.",
            variant: "destructive",
          });
          return;
        }
        
        setPreviewUrl(result);
        uploadMutation.mutate(result);
      };
      reader.readAsDataURL(compressedFile);
      
      toast({
        title: "Image Compressed",
        description: `Original size: ${(file.size / 1024 / 1024).toFixed(2)}MB, Compressed to: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
      });
    } catch (error) {
      console.error('Error compressing image:', error);
      toast({
        title: "Compression Failed",
        description: "Failed to compress image. Please try a different image.",
        variant: "destructive",
      });
    }
  };

  const displayPicture = previewUrl || userData?.profilePicture;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Picture</CardTitle>
        <CardDescription>Upload or update your profile picture</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <Avatar className="h-32 w-32">
          <AvatarImage src={displayPicture || undefined} alt={userData?.username} />
          <AvatarFallback>
            <User className="h-16 w-16" />
          </AvatarFallback>
        </Avatar>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          data-testid="input-profile-picture"
        />
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
          data-testid="button-upload-picture"
        >
          {uploadMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Picture
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
