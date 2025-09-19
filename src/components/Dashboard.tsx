import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Heart, Brain, TrendingUp, Calendar, Smile, Meh, Frown } from "lucide-react";
import WebcamCapture from "./WebcamCapture";
import { emotionAnalysisService, EmotionResult } from "@/services/emotionAnalysis";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [recentEmotions, setRecentEmotions] = useState<EmotionResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleEmotionCapture = async (imageData: string) => {
    if (isAnalyzing) return;
    
    try {
      setIsAnalyzing(true);
      console.log('Analyzing emotion...');
      
      const result = await emotionAnalysisService.analyzeEmotion(imageData);
      
      setRecentEmotions(prev => {
        const updated = [result, ...prev.slice(0, 4)]; // Keep last 5 results
        return updated;
      });

      console.log('Emotion detected:', result);
    } catch (error) {
      console.error('Failed to analyze emotion:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze emotion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-calm">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Wellness Dashboard</h1>
          <p className="text-muted-foreground">Track your emotional journey and discover insights about your mental wellness.</p>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Webcam & Analysis */}
          <div className="lg:col-span-2 space-y-6">
            <WebcamCapture onCapture={handleEmotionCapture} />
            
            {/* Recent Analysis */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Emotion Analysis</h3>
                {isAnalyzing && (
                  <Badge variant="secondary" className="animate-pulse">
                    Analyzing...
                  </Badge>
                )}
              </div>
              <div className="space-y-4">
                {recentEmotions.length > 0 ? (
                  recentEmotions.map((emotion, index) => (
                    <EmotionEntry 
                      key={`${emotion.timestamp.getTime()}-${index}`}
                      emotion={emotion.emotion} 
                      confidence={emotion.confidence} 
                      time={getTimeAgo(emotion.timestamp)} 
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Start camera analysis to see your emotions</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Stats & Insights */}
          <div className="space-y-6">
            {/* Today's Summary */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Today's Summary</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Sessions</span>
                  <Badge variant="outline">3</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Dominant Mood</span>
                  <Badge className="bg-gradient-hero">
                    {recentEmotions.length > 0 ? recentEmotions[0].emotion : 'N/A'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Wellness Score</span>
                  <div className="flex items-center gap-2">
                    <Progress value={78} className="w-16 h-2" />
                    <span className="text-sm font-medium">78%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Mood Trends */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-accent" />
                <h3 className="text-lg font-semibold">This Week</h3>
              </div>
              <div className="space-y-3">
                <MoodTrend emotion="Happy" percentage={45} icon={<Smile className="h-4 w-4" />} />
                <MoodTrend emotion="Calm" percentage={35} icon={<Meh className="h-4 w-4" />} />
                <MoodTrend emotion="Stressed" percentage={20} icon={<Frown className="h-4 w-4" />} />
              </div>
            </Card>

            {/* Recommendations */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-5 w-5 text-destructive" />
                <h3 className="text-lg font-semibold">Recommendations</h3>
              </div>
              <div className="space-y-3">
                <RecommendationItem 
                  title="Take a mindful break"
                  description="5-minute breathing exercise"
                  type="Activity"
                />
                <RecommendationItem 
                  title="Listen to calming music"
                  description="Classical playlist for focus"
                  type="Music"
                />
                <RecommendationItem 
                  title="Green tea"
                  description="Helps with relaxation"
                  type="Nutrition"
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmotionEntry = ({ emotion, confidence, time }: { 
  emotion: string; 
  confidence: number; 
  time: string; 
}) => (
  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
    <div className="flex items-center gap-3">
      <Brain className="h-5 w-5 text-primary" />
      <div>
        <span className="font-medium">{emotion}</span>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
    <Badge variant="secondary">{confidence}%</Badge>
  </div>
);

const MoodTrend = ({ emotion, percentage, icon }: { 
  emotion: string; 
  percentage: number; 
  icon: React.ReactNode; 
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-sm">{emotion}</span>
    </div>
    <div className="flex items-center gap-2">
      <Progress value={percentage} className="w-16 h-2" />
      <span className="text-sm text-muted-foreground">{percentage}%</span>
    </div>
  </div>
);

const RecommendationItem = ({ title, description, type }: { 
  title: string; 
  description: string; 
  type: string; 
}) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{title}</span>
      <Badge variant="outline" className="text-xs">{type}</Badge>
    </div>
    <p className="text-xs text-muted-foreground">{description}</p>
  </div>
);

// Helper function to format time ago
const getTimeAgo = (timestamp: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
};

export default Dashboard;