import { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, CameraOff, BrainCircuit, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WebcamCapture = ({ onCapture, isAnalyzing = false, className = "" }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stream, setStream] = useState(null);
  const [cooldown, setCooldown] = useState(false);
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
          description: "Your camera is now ready. Click 'Analyze Emotion' to capture.",
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
    if (!videoRef.current || !canvasRef.current || !isStreaming || isAnalyzing || cooldown) return;

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
    
    // UI Cooldown to prevent spam clicks while waiting for the actual state update
    setCooldown(true);
    setTimeout(() => setCooldown(false), 3000);

    if (onCapture) {
      onCapture(imageData);
    }
  };

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
              <Badge variant={isAnalyzing ? "default" : "secondary"}>
                {isAnalyzing ? "Analyzing..." : "Ready"}
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
            <>
              <Button 
                onClick={captureFrame} 
                className="flex-1"
                disabled={isAnalyzing || cooldown}
              >
                {isAnalyzing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <BrainCircuit className="mr-2 h-4 w-4" />
                )}
                {isAnalyzing ? 'Analyzing...' : 'Analyze Emotion'}
              </Button>
              <Button onClick={stopWebcam} variant="outline" size="icon">
                <CameraOff className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default WebcamCapture;
