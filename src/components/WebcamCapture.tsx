import React, { useRef, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, CameraOff, Play, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WebcamCaptureProps {
  onCapture?: (imageData: string) => void;
  isActive?: boolean;
  className?: string;
}

const WebcamCapture = ({ onCapture, isActive = false, className = "" }: WebcamCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { toast } = useToast();

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsStreaming(true);
        
        toast({
          title: "Webcam activated",
          description: "Your camera is now ready for emotion tracking.",
        });
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to use emotion tracking.",
        variant: "destructive",
      });
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsStreaming(false);
      setIsCapturing(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      toast({
        title: "Webcam stopped",
        description: "Camera has been turned off.",
      });
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64 JPEG
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    if (onCapture) {
      onCapture(imageData);
    }
  };

  const startCapturing = () => {
    if (!isStreaming) {
      toast({
        title: "Webcam not active",
        description: "Please start your webcam first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsCapturing(true);
    toast({
      title: "Emotion tracking started",
      description: "Analyzing your expressions every 3 seconds.",
    });
  };

  const stopCapturing = () => {
    setIsCapturing(false);
    toast({
      title: "Emotion tracking stopped",
      description: "Analysis has been paused.",
    });
  };

  // Auto-capture every 3 seconds when capturing is active
  useEffect(() => {
    if (!isCapturing) return;

    const interval = setInterval(() => {
      captureFrame();
    }, 3000);

    return () => clearInterval(interval);
  }, [isCapturing, isStreaming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Emotion Tracking</h3>
          <div className="flex gap-2">
            {isStreaming && (
              <Badge variant={isCapturing ? "default" : "secondary"}>
                {isCapturing ? "Analyzing" : "Ready"}
              </Badge>
            )}
          </div>
        </div>

        {/* Video Preview */}
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${!isStreaming ? 'hidden' : ''}`}
          />
          
          {!isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-2">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Camera not active</p>
              </div>
            </div>
          )}
          
          {isCapturing && (
            <div className="absolute top-2 right-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            </div>
          )}
        </div>

        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Controls */}
        <div className="flex gap-2">
          {!isStreaming ? (
            <Button onClick={startWebcam} className="flex-1">
              <Camera className="mr-2 h-4 w-4" />
              Start Camera
            </Button>
          ) : (
            <Button onClick={stopWebcam} variant="outline" className="flex-1">
              <CameraOff className="mr-2 h-4 w-4" />
              Stop Camera
            </Button>
          )}
          
          {isStreaming && (
            <>
              {!isCapturing ? (
                <Button onClick={startCapturing} className="flex-1">
                  <Play className="mr-2 h-4 w-4" />
                  Start Analysis
                </Button>
              ) : (
                <Button onClick={stopCapturing} variant="outline" className="flex-1">
                  <Square className="mr-2 h-4 w-4" />
                  Stop Analysis
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default WebcamCapture;