import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Music, Coffee, PersonStanding, MessageCircleHeart, BrainCircuit, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

import ChatWidget from "@/components/ChatWidget";

const Features = () => {
  const [recommendations, setRecommendations] = useState(null);
  const [mood, setMood] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user) return;
      try {
        const response = await fetch('/api/recommendations', { credentials: 'include' });
        const result = await response.json();
        if (result.success) {
          if (result.noData) {
            setRecommendations({ noData: true });
          } else if (result.data) {
            setMood(result.mood || null);
            setRecommendations(result.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-calm">
        <Navigation />
        <div className="container mx-auto px-6 pt-32 text-center">
          <h1 className="text-3xl font-bold mb-4">AI Wellness Hub</h1>
          <p className="text-muted-foreground">Please sign in to see your personalized AI recommendations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-calm pb-20">
      <Navigation />
      
      <div className="container mx-auto px-6 pt-32">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Your AI Action Plan</h1>
          <p className="text-lg text-muted-foreground">
            Based on your recent emotions, PsyConnect's Gemini AI has crafted this personalized wellness guide just for you.
          </p>
          {mood && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
              <Sparkles className="h-4 w-4" />
              Tuned to your current mood: {mood}
            </div>
          )}
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <>
              {[1, 2, 3, 4, 5].map(i => (
                <Card key={i} className="p-6 h-48">
                  <Skeleton className="h-10 w-10 rounded-full mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-16 w-full" />
                </Card>
              ))}
            </>
          ) : recommendations?.noData ? (
            <div className="col-span-full text-center py-16">
              <div className="inline-flex items-center justify-center p-6 bg-white rounded-full shadow-sm mb-6">
                <BrainCircuit className="h-12 w-12 text-muted-foreground opacity-50" />
              </div>
              <h2 className="text-2xl font-bold mb-3">No Emotions Tracked Yet</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Your AI Action Plan requires at least one emotion log to understand how you're feeling.
              </p>
              <Button onClick={() => window.location.href = '/'} className="bg-gradient-hero">
                Go to Dashboard to Track
              </Button>
            </div>
          ) : recommendations ? (
            <>
              <RecommendationCard 
                icon={<Music className="h-6 w-6 text-blue-500" />} 
                title="Music Therapy" 
                content={recommendations.music}
                color="bg-blue-500/10 border-blue-500/20"
              />
              <RecommendationCard 
                icon={<Coffee className="h-6 w-6 text-orange-500" />} 
                title="Mood Food" 
                content={recommendations.food}
                color="bg-orange-500/10 border-orange-500/20"
              />
              <RecommendationCard 
                icon={<PersonStanding className="h-6 w-6 text-green-500" />} 
                title="Move Your Body" 
                content={recommendations.activity}
                color="bg-green-500/10 border-green-500/20"
              />
              <RecommendationCard 
                icon={<MessageCircleHeart className="h-6 w-6 text-pink-500" />} 
                title="Social Connection" 
                content={recommendations.social}
                color="bg-pink-500/10 border-pink-500/20"
              />
              <RecommendationCard 
                icon={<BrainCircuit className="h-6 w-6 text-purple-500" />} 
                title="Mind & Soul" 
                content={recommendations.mental}
                color="bg-purple-500/10 border-purple-500/20"
                className="md:col-span-2 lg:col-span-1"
              />
            </>
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">Unable to load recommendations at this time.</p>
            </div>
          )}
        </div>
      </div>
      <ChatWidget />
    </div>
  );
};

const RecommendationCard = ({ icon, title, content, color, className = "" }) => (
  <Card className={`p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border ${color} ${className}`}>
    <div className="flex items-center gap-4 mb-4">
      <div className={`p-3 rounded-xl bg-background shadow-sm`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
    </div>
    <p className="text-muted-foreground leading-relaxed">
      {content}
    </p>
  </Card>
);

export default Features;
